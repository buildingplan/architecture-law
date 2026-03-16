export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: '좌표가 필요합니다' });
  }

  const API_KEY = process.env.LAND_API_KEY;

  try {
    const url = `http://apis.data.go.kr/1611000/nsdi/LandUseService/wfs/LandUseWFS?service=WFS&version=1.0.0&request=GetFeature&typeName=LandUse:LT_C_UQ111&output=application/json&srsName=EPSG:4326&bbox=${parseFloat(lng)-0.0005},${parseFloat(lat)-0.0005},${parseFloat(lng)+0.0005},${parseFloat(lat)+0.0005}&ServiceKey=${API_KEY}`;

    const response = await fetch(url);
    const text = await response.text();

    let data;
    try { data = JSON.parse(text); }
    catch(e) { return res.status(200).json({ zone: null, raw: text.substring(0, 300) }); }

    if (data?.features && data.features.length > 0) {
      const props = data.features[0].properties;
      const zone = props.uname || props.prpos_area1_nm || '';
      return res.status(200).json({
        zone,
        isJigudan: zone.includes('지구단위') || zone.includes('특별계획'),
        raw: props
      });
    }
    return res.status(200).json({ zone: null, raw: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
