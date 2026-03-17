export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: '좌표가 필요합니다' });
  }

  const API_KEY = process.env.LAND_API_KEY;

  try {
    const kakaoRes = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${lng}&y=${lat}`,
      { headers: { Authorization: 'KakaoAK 9d1f0f1648e8e28d3aa84af2c46d4c75' } }
    );
    const kakaoData = await kakaoRes.json();
    const region = kakaoData.documents?.find(d => d.region_type === 'B');

    if (!region) {
      return res.status(200).json({ zone: null, message: '법정동 코드를 찾을 수 없습니다' });
    }

    const areaCd = region.code.substring(0, 5);

    const landRes = await fetch(
      `https://apis.data.go.kr/1613000/arLandUseInfoService/getLandUseInfo?serviceKey=${encodeURIComponent(API_KEY)}&areaCd=${areaCd}&numOfRows=10&pageNo=1&_type=json`
    );
    const landText = await landRes.text();

    let landData;
    try { landData = JSON.parse(landText); }
    catch(e) { return res.status(200).json({ zone: null, raw: landText.substring(0, 500) }); }

    return res.status(200).json({
      zone: null,
      raw: landData,
      areaCd,
      regionName: region.address_name
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
