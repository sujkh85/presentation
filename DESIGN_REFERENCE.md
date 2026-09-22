# 디자인 대응

레퍼런스: https://astraeoratio.plaync.com/ko-kr/index

데스크톱 화면을 직접 확인했습니다. 검은 고정 메뉴, 큰 비주얼과 흰 제목, 중앙 카드가 커지는 세계관 선택기, 검정·흰색 대각선 분할의 캐릭터 소개를 관찰했습니다. 소식 및 미디어 구조는 접근 가능한 페이지 구조에서 확인했습니다. 원본 모바일 화면은 별도로 검증하지 않았습니다.

| 관찰한 원본 구성 | 발표 사이트 대응 |
|---|---|
| 고정 헤더, 로고와 메뉴 | pwdff 로고, 여섯 발표 섹션 링크, 대본·전체화면·발표 모드 |
| 대형 비주얼과 제목 | 생성 은하 배경, 큰 세리프 제목, 발표 도입 |
| 중앙 강조 카드와 대각선 이미지 경계 | 환경·스케줄·한계의 3개 선택 카드 |
| 대각선 흑백 분할과 캐릭터 선택 | 왼쪽 콘솔 재현 화면, 오른쪽 시나리오 및 단계 선택 |
| (같은 분할을 한 번 더) | AI-assisted 섹션. 같은 레이아웃에 보랏빛 강조색으로 구분 |
| 소식 목록 | 검증 범위. 현황·AI 두 그룹으로 나눈 상태 목록 |
| 미디어 갤러리 | 대본·원샷 프롬프트·검증 설계 자료 |

사용자의 후속 요청에 따라 콘셉트를 반짝이는 은하로 변경했습니다. 원본의 게임 이미지 대신 새 은하 이미지를 사용하며, 브랜드·문구·동작은 발표 목적에 맞게 변경했습니다. 원본과 픽셀 단위로 동일한 복제는 아닙니다. 색상·치수·반응형 값은 발표를 위해 설계한 값입니다.

독창적 은하 이미지는 built-in ImageGen으로 제작했고 `dist/assets/galaxy.png`에 저장했습니다. 게임 이미지와 외부 폰트는 최종 사이트에 포함하지 않습니다. 레퍼런스는 사이트 하단에 링크합니다.

## 이미지 생성 프롬프트

Use case: stylized-concept. Asset type: full-bleed website hero background, wide 16:9 landscape, preferably 2048x1152. One cinematic sparkling galaxy background with a premium celestial dreamlike feeling. Vast indigo night sky with delicate luminous lilac and cyan nebula flowing diagonally from lower center toward upper right, dense tiny pinprick stars, several elegant bright four-point stars, ethereal fine cosmic dust. Photographic fantasy astronomy, richly detailed yet sophisticated. Deep near-black blue negative space in the left 45 percent for a large white serif title added later; luminous nebula mostly on the right. Luminous, serene, ethereal, visibly sparkling but restrained. Deep midnight indigo, violet, lilac, icy blue and cyan. No foreground planets, people, text, logos, UI, border or watermark.

실제 생성 크기: 1672×941. 사이트에서 48개의 작은 별 점을 CSS로 겹쳐 은은하게 반짝이도록 했습니다. reduced-motion과 발표 모드에서는 움직임을 중지합니다.

## 콘솔 재현 화면

원본 레퍼런스에는 없는 부분입니다. 발표 주제가 예매 화면이 아니라 테스트 실행이므로, 시연 패널에 들어갈 부품을 새로 만들었습니다. 브라우저 창 프레임, 터미널 로그, 스케줄 시계, 실행 체크리스트, 로그인 폼, 메일 카드, 인증 코드 입력, 한·영 분할 비교, 기획서 카드입니다. 모두 CSS로 구현했고 실제 콘솔 캡처가 아닙니다.

AI 섹션은 같은 레이아웃에 보랏빛(#5a4b9a 계열) 강조색을 써서 전반부와 구분했습니다. 대각선 분할의 어두운 면도 남색에서 보랏빛 계열로 바꿨습니다.
