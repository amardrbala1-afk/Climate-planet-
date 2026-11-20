/** Climate Planet V9 — original local weather symbols, strict WMO classification.
 * This module presents conditions only; it does not generate weather data.
 */
export const iconPath=name=>`/images/weather-v9/${name}.svg`;
export function weatherIcon(code,day=true){
 const n=Number(code);
 if(!Number.isFinite(n))return 'cloudy';
 if(n===0)return day?'sun':'moon';
 if(n===1||n===2)return day?'partly-cloudy':'partly-cloudy-night';
 if(n===3)return 'overcast';
 if(n===45||n===48)return 'fog';
 if([51,53,55,56,57].includes(n))return 'drizzle';
 if([61,63,65,66,67,80,81,82].includes(n))return 'rain';
 if([71,73,75,77,85,86].includes(n))return 'snow';
 if([95,96,99].includes(n))return 'storm';
 return 'cloudy';
}
export function weatherDescription(code){
 const n=Number(code);
 if(n===0)return 'سماء صافية';
 if(n===1)return 'أجواء صافية غالبًا';
 if(n===2)return 'غائم جزئيًا';
 if(n===3)return 'غائم';
 if(n===45||n===48)return 'ضباب';
 if([51,53,55,56,57].includes(n))return 'رذاذ';
 if([61,63,65,66,67,80,81,82].includes(n))return 'أمطار';
 if([71,73,75,77,85,86].includes(n))return 'ثلوج';
 if([95,96,99].includes(n))return 'عواصف رعدية';
 return 'حالة جوية متغيرة';
}
