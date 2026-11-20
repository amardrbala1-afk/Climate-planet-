"""Ensures GFS field sanity metadata guards reject mis-attributed model values."""
import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
from publish_gfs import validate_grib_variable,SPEC

class MockArray:
    def __init__(self,attrs):self.attrs=attrs;self.coords={}

class Safety(unittest.TestCase):
    def test_z500(self):
        a=MockArray({'GRIB_shortName':'gh','GRIB_typeOfLevel':'isobaricInhPa','GRIB_level':500,'GRIB_dataDate':20261120,'GRIB_dataTime':0,'GRIB_stepRange':'24','GRIB_stepType':'instant','units':'gpm'})
        self.assertEqual(validate_grib_variable(a,SPEC[('europe','z500')],'20261120','00',24,'z500',None),'m')
        a.attrs['GRIB_level']=850
        with self.assertRaises(ValueError):validate_grib_variable(a,SPEC[('europe','z500')],'20261120','00',24,'z500',None)
    def test_precip_range(self):
        a=MockArray({'GRIB_shortName':'tp','GRIB_typeOfLevel':'surface','GRIB_level':0,'GRIB_dataDate':20261120,'GRIB_dataTime':0,'GRIB_stepRange':'0-6','GRIB_stepType':'accum','units':'kg m**-2'})
        self.assertEqual(validate_grib_variable(a,SPEC[('levant','rain')],'20261120','00',6,'rain',6),'mm')
        a.attrs['GRIB_stepRange']='0-24'
        with self.assertRaises(ValueError):validate_grib_variable(a,SPEC[('levant','rain')],'20261120','00',24,'rain',6)
        a.attrs['GRIB_stepRange']='0-6';a.attrs['GRIB_dataDate']=20261119
        with self.assertRaises(ValueError):validate_grib_variable(a,SPEC[('levant','rain')],'20261120','00',6,'rain',6)
if __name__=='__main__':unittest.main()
