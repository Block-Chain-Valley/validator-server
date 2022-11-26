# Validator, WHOSCALL on Metamask

의심의 여지 없이 당하기 쉽상인 사기, Validator로 손쉽게 예방하세요. 

<img width="1552" alt="벨리" src="https://user-images.githubusercontent.com/95950146/204106813-c848a1cb-7425-4530-818b-663cfbbcdee5.png">

## 프로젝트 소개 🎶
> Validator는 Metamask snap을 바탕으로, 트랜잭션이 발생할 시 전송 대상(주소)에 대한 신고 데이터를 보여줍니다.
마치 전화가 오면 스팸 번호인지 아닌지 정보를 보여주는 후스콜처럼 말이죠. 


## 주요 기능 ✏️
### ✅ 편리한 Snap 설치 지원
메타마스크의 확장 프로그램으로 이해할 수 있는 Snap은 Validator 사이트에서 누구나 쉽게 다운로드 받을 수 있습니다. 단, Flask가 설치되어 있지 않는 경우 이를 먼저 다운로드 받을 수 있도록 안내합니다. 
<img width="1552" alt="스냅설치" src="https://user-images.githubusercontent.com/95950146/204106833-68c637fa-c0da-4746-b50d-7078fc1b081e.png">

### ✅ 쉽게 확인하는 위험 여부
자산 전송을 위해 메타마스크를 실행하면 Validator의 Snap은 수취하는 주소에 대한 위험성 정보를 보여줍니다. 사용자는 한 번의 클릭으로 의심도 하지 못하고 스캐머에게 자산을 송금하던 일을 방지할 수 있습니다. 
<img width="472" alt="스냅" src="https://user-images.githubusercontent.com/95950146/204106836-a06fa4ce-047e-40c3-90ed-914628e09889.png">

### ✅ 사용자 참여형 신고 정보 DB 구축
사용자가 웹사이트에 접속하여 부정 주소를 신고할 수 있습니다. 신고하려는 프로젝트명, 체인, 주소, 해당 프로젝트 사이트의 url, 신고 사유를 입력 받습니다. 또한 스캐머에 의한 악의적인 신고를 막기 위해, 동일 이용자에 의한 중복 신고를 막고 하루 최대 신고 횟수를 제한합니다.
<img width="860" alt="신고목록" src="https://user-images.githubusercontent.com/95950146/204106841-1c0736c3-da1e-48c2-8446-b395cd82a32b.png">

### ✅ 타 서비스 API 사용을 통한 신뢰성 제고 
Chainsight, Alchemy와 같이 위험도가 높은 주소 목록 API를 제공하는 서비스를 사용합니다. 이를 통해 Validator의 자체 DB가 악의적인 신고 등으로 인해 오염되었을 때 생길 수 있는 단일 실패 지점을 예방합니다. 
<img width="496" alt="체인사이트" src="https://user-images.githubusercontent.com/95950146/204106859-a443b2c5-2869-4338-8e61-1fe7051a92a5.png">
<img width="647" alt="알케미" src="https://user-images.githubusercontent.com/95950146/204106860-7aa8c1e1-b4ff-4cf2-993f-7b94fd52fc53.png">


## 로드맵 🎯
### 🚩UI 개편
현재는 메타마스크에서 커스텀 UI를 지원하지 않습니다. 이 때문에 위험과 관련된 정보를 단순히 문자열로만 제공할 수 밖에 없다는 한계를 가지고 있습니다. 메타마스크 측에서 UI 커스텀 기능을 제공하는 것을 로드맵으로 삼고 있기 때문에, 이에 맞추어 Validator 또한 사용자 친화적인 UI를 선보일 예정입니다. 
<img width="376" alt="커스텀UI" src="https://user-images.githubusercontent.com/95950146/204106861-e8cfc6ab-9158-45a5-84bf-d1c5548e91d5.png">
만약 목표 기간(2022.12.) 내에 커스텀 UI를 지원하지 않을 경우, 별도의 크롬 확장프로그램과 Snap을 연결시켜 알림 서비스로 대체하는 방식으로 문제를 해결할 계획입니다. 

### 🚩Business
Validator의 추후 3개월 서비스 제공 계획은 다음과 같습니다. 
<img width="1214" alt="로드맵" src="https://user-images.githubusercontent.com/95950146/204106867-fc4685e1-1ab3-4997-8f9d-fb4ce917b647.png">


## TEAM dreampluz 🔥
> 만약 당신이 우리의 팀명을 dreamplus가 아닌가 생각하셨다면, 당신은 잠재적인 사기 피해자입니다. 

### 🫶 Members
|  🎨 UIUX  |  💻 FRONT  |  ⚙️ BACK |  ⚙️ BACK  |
<img width="292" alt="KakaoTalk_Image_2022-11-27-04-36-29_004" src="https://user-images.githubusercontent.com/95950146/204106875-63055a67-1389-4b5d-9d37-ab67891c50a3.png">
<img width="287" alt="KakaoTalk_Image_2022-11-27-04-36-29_003" src="https://user-images.githubusercontent.com/95950146/204106876-36ef3a28-6af5-4464-b661-2ded23dc4d37.png">
<img width="288" alt="KakaoTalk_Image_2022-11-27-04-36-29_002" src="https://user-images.githubusercontent.com/95950146/204106877-660751fa-ac80-4570-b7e9-28e98c8db2ca.png">
<img width="298" alt="KakaoTalk_Image_2022-11-27-04-36-28_001" src="https://user-images.githubusercontent.com/95950146/204106878-0dcfd0c0-b136-47f0-a8a2-7407f97596fa.png">

