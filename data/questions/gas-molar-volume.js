import{q,mc}from"./_helpers.js";const numeric={type:"numeric",answerMode:"number",tolerance:.001,inputMode:"numeric_keypad",allowedKeys:["0","1","2","3","4","5","6","7","8","9","."],autoSubmit:false};
export const gasMolarVolumeQuestions=Object.freeze([
q("gas_volume_001","gas_molar_volume",1,"0 ℃, 1기압에서 기체 1 mol의 부피를 22.4 L로 할 때, 산소 2 mol의 부피는?",["44.8"],"2×22.4=44.8 L입니다.",["몰수에서 부피","0 ℃","1기압"],{...numeric,unit:"L"}),
q("gas_volume_002","gas_molar_volume",1,"0 ℃, 1기압에서 기체 1 mol의 부피를 22.4 L로 할 때, 질소 0.5 mol의 부피는?",["11.2"],"0.5×22.4=11.2 L입니다.",["몰수에서 부피","0 ℃","1기압"],{...numeric,unit:"L"}),
q("gas_volume_003","gas_molar_volume",1,"0 ℃, 1기압에서 기체 1 mol의 부피를 22.4 L로 할 때, 33.6 L는 몇 mol인가?",["1.5"],"33.6÷22.4=1.5 mol입니다.",["부피에서 몰수","0 ℃","1기압"],{...numeric,unit:"mol"}),
q("gas_volume_004","gas_molar_volume",2,"25 ℃, 1기압에서 기체 1 mol의 부피가 24.5 L일 때, 3 mol의 부피는?",["73.5"],"3×24.5=73.5 L입니다.",["몰수에서 부피","25 ℃","1기압"],{...numeric,unit:"L"}),
mc("gas_volume_005","gas_molar_volume",2,"같은 온도와 같은 압력에서 수소 2 mol과 산소 1 mol의 부피비는?",["1:1","2:1","1:2","4:1"],1,"같은 온도와 압력에서는 기체의 부피비가 몰수비와 같습니다.",["기체 부피비"]),
q("gas_volume_006","gas_molar_volume",2,"같은 온도와 같은 압력에서 기체 A 3 mol의 부피가 60 L일 때, 기체 B 1 mol의 부피는?",["20"],"같은 조건에서 몰수비와 부피비가 같으므로 60÷3=20 L입니다.",["기체 부피비"],{...numeric,unit:"L"}),
mc("gas_volume_007","gas_molar_volume",3,"같은 온도와 같은 압력에서 2H₂ + O₂ → 2H₂O(g)일 때, 반응하는 H₂와 O₂의 부피비는?",["1:1","2:1","1:2","2:2"],1,"같은 조건에서 기체 부피비는 반응식 계수비 2:1과 같습니다.",["계수비","기체 부피비"]),
q("gas_volume_008","gas_molar_volume",3,"같은 온도와 같은 압력에서 N₂ + 3H₂ → 2NH₃일 때, 질소 10 L와 완전히 반응하는 수소의 부피는?",["30"],"계수비 N₂:H₂=1:3이므로 10×3=30 L입니다.",["계수비","기체 부피비"],{...numeric,unit:"L"})]);
