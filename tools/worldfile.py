"""Exact affine PNG world-file calibration for the two owner-supplied maps.

The .pgw files store the 6 affine coefficients, but not a CRS identifier.
The project explicitly *assumes EPSG:3857* after inspecting map geography
and bounds. Publication is rejected if this CRS/extent contract fails.
"""
from dataclasses import dataclass
from pathlib import Path
import math
import numpy as np

R=6378137.0

@dataclass(frozen=True)
class WorldFile:
    A: float
    D: float
    B: float
    E: float
    C: float
    F: float

    @classmethod
    def read(cls, filename):
        vals=[float(x) for x in Path(filename).read_text(encoding='utf-8-sig').split()]
        if len(vals)!=6 or not all(math.isfinite(v) for v in vals):
            raise ValueError('Expected six finite .pgw coefficients')
        obj=cls(*vals)
        if obj.A<=0 or obj.E>=0 or abs(obj.B)>1e-7 or abs(obj.D)>1e-7:
            raise ValueError('Only north-up EPSG:3857 world files are supported')
        if not 200<obj.A<10000 or not -10000<obj.E<-200:
            raise ValueError('Unexpected map resolution; check world file and CRS')
        return obj

    def image_to_lonlat(self, pixel_x, pixel_y):
        x=self.A*np.asarray(pixel_x)+self.B*np.asarray(pixel_y)+self.C
        y=self.D*np.asarray(pixel_x)+self.E*np.asarray(pixel_y)+self.F
        lon=np.rad2deg(x/R)
        lat=np.rad2deg(np.arctan(np.sinh(y/R)))
        return lon,lat

    def lonlat_to_image(self, lon, lat):
        lon=np.asarray(lon,dtype=float);lat=np.asarray(lat,dtype=float)
        if np.any(np.abs(lat)>85.051129):raise ValueError('Latitude outside Web Mercator domain')
        x=R*np.deg2rad(lon)
        y=R*np.log(np.tan(np.pi/4+np.deg2rad(lat)/2))
        det=self.A*self.E-self.B*self.D
        px=(self.E*(x-self.C)-self.B*(y-self.F))/det
        py=(-self.D*(x-self.C)+self.A*(y-self.F))/det
        return px,py

    def verify(self, region, w, h):
        if region not in {'europe','levant'}:raise ValueError('Unknown map region')
        west,north=self.image_to_lonlat(0,0)
        east,south=self.image_to_lonlat(w-1,h-1)
        if region=='europe':expected=(-10.60,63.11,47.55,9.26)
        else:expected=(24.0,47.72,53.07,17.80)
        got=(float(west),float(north),float(east),float(south))
        if any(abs(a-b)>.13 for a,b in zip(got,expected)):
            raise ValueError(f'Unexpected {region} extent {got} (assumed EPSG:3857); refusing a shifted overlay')
        # Ground truth locations should lie inside the expected map pixels.
        check={'europe':[(2.35,48.86),(35.22,31.77)],'levant':[(35.22,31.77),(36.29,33.51)]}[region]
        for lon,lat in check:
            px,py=self.lonlat_to_image(lon,lat)
            if not (0<=px<w and 0<=py<h):raise ValueError('Known city outside projected image')
        return got
