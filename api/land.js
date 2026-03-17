export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: '좌표가 필요합니다' });
  }

  try {
    // 1단계: 카카오 좌표 → 법정동코드 + 지번
    const kakaoRes = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
      { headers: { Authorization: 'KakaoAK 9d1f0f1648e8e28d3aa84af2c46d4c75' } }
    );
    const kakaoData = await kakaoRes.json();
    const addr = kakaoData.documents?.[0]?.address;

    if (!addr) {
      return res.status(200).json({ zone: null, message: '주소 변환 실패' });
    }

    const sigunguCd = addr.b_code.substring(0, 5);
    const bjdongCd = addr.b_code.substring(5, 10);
    const pnu = addr.b_code + (addr.mountain_yn === 'Y' ? '1' : '0') +
                String(addr.main_address_no).padStart(4, '0') +
                String(addr.sub_address_no || 0).padStart(4, '0');

    // 2단계: 토지이음 필지 용도지역 조회
    const eumRes = await fetch(
      `https://www.eum.go.kr/web/ar/lu/luLandDet.jsp?pnu=${pnu}`
    );
    const eumText = await eumRes.text();

    // 용도지역 추출
    const zoneMatch = eumText.match(/용도지역[^가-힣]*([가-힣]+지역)/);
    const zone = zoneMatch ? zoneMatch[1] : null;

    return res.status(200).json({
      zone,
      pnu,
      address: addr.address_name,
      raw: eumText.substring(0, 1000)
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

Commit 후 다시 테스트해보세요!
```
https://architecture-law.vercel.app/api/land?lat=37.5135&lng=127.0622
