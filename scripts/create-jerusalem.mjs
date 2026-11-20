// Hand-transcribed winter (Dec, Jan, Feb) dates from credited source.
// IMPORTANT: missing depth remains null, never 0. The source is last authored 2020 and may not cover recent winters.
import {writeFile} from 'node:fs/promises';
const source='https://www.arab4climate.com/أرشيف-ثلوج-مدينة-القدس-2/';
// date YYYY-MM-DD | number(cm) or x (not specified), each row is an observation entry in the cited article.
const raw=`
2019-01-16|2
2017-01-27|x
2016-01-26|x
2015-02-19|35
2015-01-09|10
2015-01-07|8
2013-12-12|65
2013-01-31|x
2013-01-09|20
2010-12-13|1
2008-02-19|5
2008-01-30|20
2006-12-27|5
2004-02-14|10
2003-02-24|35
2002-01-09|5
2002-01-07|5
2000-01-27|40
2000-01-05|x
1998-01-11|20
1997-02-25|x
1996-01-18|x
1994-12-03|x
1993-02-09|x
1993-02-02|5
1992-12-15|x
1992-02-23|45
1992-02-09|6
1992-02-04|x
1992-02-01|x
1992-01-01|40
1989-02-12|x
1989-01-15|3
1988-02-23|x
1988-02-02|x
1988-01-17|x
1985-02-25|x
1983-02-26|5
1983-02-19|15
1983-01-23|5
1983-01-18|5
1983-01-01|15
1982-02-04|5
1981-12-11|x
1980-12-10|x
1980-01-05|x
1977-01-05|x
1976-02-09|1
1975-02-10|3
1974-02-16|30
1974-02-01|3
1974-01-22|15
1974-01-17|30
1973-01-14|40
1972-02-07|20
1971-12-27|x
1971-02-13|x
1970-12-12|x
1969-01-29|10
1969-01-17|x
1968-01-31|x
1968-01-15|35
1967-02-26|x
1967-01-29|x
1967-01-21|x
1964-02-05|5
1964-01-18|x
1963-12-30|x
1962-02-19|20
1961-02-28|x
1961-02-16|x
1961-02-08|x
1961-01-21|x
1959-02-24|20
1959-02-21|x
1959-02-14|3
1958-01-30|x
1957-02-01|40
1956-12-10|x
1956-02-10|x
1953-12-19|20
1952-01-09|x
1951-12-19|20
1950-02-04|70
1950-01-26|20
1950-01-15|x
`;
// In the source, 1982-83 also has 05 Mar (excluded); 1982-83 01 Jan and others included.
// 1979-80 02 Mar 40 excluded, 2011-12 02 Mar 4 excluded, other spring rows excluded.
const rows=raw.trim().split('\n').map((line,i)=>{const [date,value]=line.trim().split('|');const year=+date.slice(0,4),month=+date.slice(5,7);if(![12,1,2].includes(month)||year<1950||year>2026)throw Error(date);return{date,season:`${month===12?year:year-1}-${month===12?year+1:year}`,depthCm:value==='x'?null:Number(value),source, id:`JRS-${date}-${i}`}});
await writeFile('data/jerusalem-snow.json',JSON.stringify({station:'القدس',period:'1949-1950 إلى 2025-2026',source,sourceUpdated:'2020-09-10',winterMonths:[12,1,2],records:rows},null,2));
console.log('archive entries:',rows.length, 'dated seasons', new Set(rows.map(r=>r.season)).size);
