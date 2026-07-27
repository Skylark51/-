const q = (id, stageId, difficulty, prompt, answers, explanation, tags, extra = {}) => ({
  id, stageId, type: "short_answer", difficulty, prompt, answers, explanation, tags, ...extra
});
const mc = (id, stageId, difficulty, prompt, choices, correctChoice, explanation, tags) => ({
  id, stageId, type: "multiple_choice", difficulty, prompt, choices, correctChoice, explanation, tags
});

export const QUESTIONS = Object.freeze([
  // 1단계: 원자 번호
  q("atomic_number_001","atomic_number",1,"원소 기호 Na의 원자 번호는?",["11"],"Na는 나트륨이며 원자 번호는 11이다.",["원소","원자번호","나트륨"],{answerMode:"number"}),
  q("atomic_number_002","atomic_number",1,"원소 기호 O의 원자 번호는?",["8"],"산소 O의 원자 번호는 8이다.",["원소","원자번호","산소"],{answerMode:"number"}),
  q("atomic_number_003","atomic_number",1,"원소 기호 Fe의 원자 번호는?",["26"],"철 Fe의 원자 번호는 26이다.",["원소","원자번호","철"],{answerMode:"number"}),
  q("atomic_number_004","atomic_number",1,"염소의 원자 번호는?",["17"],"염소 Cl의 원자 번호는 17이다.",["원소","원자번호","염소"],{answerMode:"number"}),
  q("atomic_number_005","atomic_number",1,"칼슘의 원자 번호는?",["20"],"칼슘 Ca의 원자 번호는 20이다.",["원소","원자번호","칼슘"],{answerMode:"number"}),
  q("atomic_number_006","atomic_number",1,"원자 번호 1인 원소의 기호는?",["H"],"원자 번호 1은 수소 H이다.",["원소","원자번호","수소"],{answerMode:"symbol"}),
  q("atomic_number_007","atomic_number",1,"원자 번호 6인 원소의 기호는?",["C"],"원자 번호 6은 탄소 C이다.",["원소","원자번호","탄소"],{answerMode:"symbol"}),
  q("atomic_number_008","atomic_number",1,"원자 번호 7인 원소의 기호는?",["N"],"원자 번호 7은 질소 N이다.",["원소","원자번호","질소"],{answerMode:"symbol"}),
  q("atomic_number_009","atomic_number",1,"마그네슘의 원자 번호는?",["12"],"마그네슘 Mg의 원자 번호는 12이다.",["원소","원자번호","마그네슘"],{answerMode:"number"}),
  q("atomic_number_010","atomic_number",1,"원자 번호 19인 원소의 기호는?",["K"],"원자 번호 19는 칼륨 K이다.",["원소","원자번호","칼륨"],{answerMode:"symbol"}),
  q("atomic_number_011","atomic_number",2,"원소 기호 Al의 원자 번호는?",["13"],"알루미늄 Al의 원자 번호는 13이다.",["원소","원자번호","알루미늄"],{answerMode:"number"}),
  q("atomic_number_012","atomic_number",2,"원자 번호 14인 원소의 기호는?",["Si"],"원자 번호 14는 규소 Si이다.",["원소","원자번호","규소"],{answerMode:"symbol"}),
  q("atomic_number_013","atomic_number",2,"인의 원자 번호는?",["15"],"인 P의 원자 번호는 15이다.",["원소","원자번호","인"],{answerMode:"number"}),
  q("atomic_number_014","atomic_number",2,"황의 원자 번호는?",["16"],"황 S의 원자 번호는 16이다.",["원소","원자번호","황"],{answerMode:"number"}),
  q("atomic_number_015","atomic_number",2,"원자 번호 18인 원소의 기호는?",["Ar"],"원자 번호 18은 아르곤 Ar이다.",["원소","원자번호","아르곤"],{answerMode:"symbol"}),
  q("atomic_number_016","atomic_number",2,"원소 기호 Cu의 원자 번호는?",["29"],"구리 Cu의 원자 번호는 29이다.",["원소","원자번호","구리"],{answerMode:"number"}),
  q("atomic_number_017","atomic_number",2,"원소 기호 Zn의 원자 번호는?",["30"],"아연 Zn의 원자 번호는 30이다.",["원소","원자번호","아연"],{answerMode:"number"}),
  q("atomic_number_018","atomic_number",2,"원자 번호 35인 원소의 기호는?",["Br"],"원자 번호 35는 브로민 Br이다.",["원소","원자번호","브로민"],{answerMode:"symbol"}),
  q("atomic_number_019","atomic_number",3,"은의 원소 기호는?",["Ag"],"은의 원소 기호는 Ag이며 원자 번호는 47이다.",["원소","원자번호","은"],{answerMode:"symbol"}),
  q("atomic_number_020","atomic_number",3,"원자 번호 53인 원소의 기호는?",["I"],"원자 번호 53은 아이오딘 I이다.",["원소","원자번호","아이오딘"],{answerMode:"symbol"}),

  // 2단계: 원자량
  q("atomic_mass_001","atomic_mass",1,"수소 H의 근사 원자량은?",["1"],"수소의 근사 원자량은 1이다.",["원자량","수소"],{answerMode:"number"}),
  q("atomic_mass_002","atomic_mass",1,"탄소 C의 근사 원자량은?",["12"],"탄소의 근사 원자량은 12이다.",["원자량","탄소"],{answerMode:"number"}),
  q("atomic_mass_003","atomic_mass",1,"질소 N의 근사 원자량은?",["14"],"질소의 근사 원자량은 14이다.",["원자량","질소"],{answerMode:"number"}),
  q("atomic_mass_004","atomic_mass",1,"산소 O의 근사 원자량은?",["16"],"산소의 근사 원자량은 16이다.",["원자량","산소"],{answerMode:"number"}),
  q("atomic_mass_005","atomic_mass",1,"나트륨 Na의 근사 원자량은?",["23"],"나트륨의 근사 원자량은 23이다.",["원자량","나트륨"],{answerMode:"number"}),
  q("atomic_mass_006","atomic_mass",1,"마그네슘 Mg의 근사 원자량은?",["24"],"마그네슘의 근사 원자량은 24이다.",["원자량","마그네슘"],{answerMode:"number"}),
  q("atomic_mass_007","atomic_mass",1,"알루미늄 Al의 근사 원자량은?",["27"],"알루미늄의 근사 원자량은 27이다.",["원자량","알루미늄"],{answerMode:"number"}),
  q("atomic_mass_008","atomic_mass",1,"규소 Si의 근사 원자량은?",["28"],"규소의 근사 원자량은 28이다.",["원자량","규소"],{answerMode:"number"}),
  q("atomic_mass_009","atomic_mass",1,"인 P의 근사 원자량은?",["31"],"인의 근사 원자량은 31이다.",["원자량","인"],{answerMode:"number"}),
  q("atomic_mass_010","atomic_mass",1,"황 S의 근사 원자량은?",["32"],"황의 근사 원자량은 32이다.",["원자량","황"],{answerMode:"number"}),
  q("atomic_mass_011","atomic_mass",2,"염소 Cl의 원자량을 소수 첫째 자리까지 쓰면?",["35.5","35.45"],"염소의 평균 원자량은 약 35.45, 교과 계산에서는 35.5를 쓴다.",["원자량","염소"],{answerMode:"number",tolerance:0.05}),
  q("atomic_mass_012","atomic_mass",2,"칼륨 K의 근사 원자량은?",["39"],"칼륨의 근사 원자량은 39이다.",["원자량","칼륨"],{answerMode:"number"}),
  q("atomic_mass_013","atomic_mass",2,"칼슘 Ca의 근사 원자량은?",["40"],"칼슘의 근사 원자량은 40이다.",["원자량","칼슘"],{answerMode:"number"}),
  q("atomic_mass_014","atomic_mass",2,"철 Fe의 근사 원자량은?",["56"],"철의 근사 원자량은 56이다.",["원자량","철"],{answerMode:"number"}),
  q("atomic_mass_015","atomic_mass",2,"구리 Cu의 원자량을 정수로 반올림하면?",["64"],"구리의 평균 원자량 63.55를 반올림하면 64이다.",["원자량","구리"],{answerMode:"number"}),
  q("atomic_mass_016","atomic_mass",2,"아연 Zn의 근사 원자량은?",["65"],"아연의 근사 원자량은 65이다.",["원자량","아연"],{answerMode:"number"}),
  q("atomic_mass_017","atomic_mass",2,"브로민 Br의 근사 원자량은?",["80"],"브로민의 평균 원자량은 약 79.9로, 근사값 80을 쓴다.",["원자량","브로민"],{answerMode:"number"}),
  q("atomic_mass_018","atomic_mass",2,"은 Ag의 근사 원자량은?",["108"],"은의 근사 원자량은 108이다.",["원자량","은"],{answerMode:"number"}),
  q("atomic_mass_019","atomic_mass",3,"아이오딘 I의 근사 원자량은?",["127"],"아이오딘의 근사 원자량은 127이다.",["원자량","아이오딘"],{answerMode:"number"}),
  q("atomic_mass_020","atomic_mass",3,"납 Pb의 근사 원자량은?",["207"],"납의 근사 원자량은 207이다.",["원자량","납"],{answerMode:"number"}),

  // 3단계: 분자량·화학식량
  q("formula_mass_001","formula_mass",1,"H₂O의 분자량은? (H=1, O=16)",["18"],"2×1+16=18이다.",["분자량","물"],{answerMode:"number"}),
  q("formula_mass_002","formula_mass",1,"CO₂의 분자량은? (C=12, O=16)",["44"],"12+2×16=44이다.",["분자량","이산화탄소"],{answerMode:"number"}),
  q("formula_mass_003","formula_mass",1,"NH₃의 분자량은? (N=14, H=1)",["17"],"14+3×1=17이다.",["분자량","암모니아"],{answerMode:"number"}),
  q("formula_mass_004","formula_mass",1,"CH₄의 분자량은? (C=12, H=1)",["16"],"12+4×1=16이다.",["분자량","메테인"],{answerMode:"number"}),
  q("formula_mass_005","formula_mass",1,"O₂의 분자량은?",["32"],"2×16=32이다.",["분자량","산소"],{answerMode:"number"}),
  q("formula_mass_006","formula_mass",1,"N₂의 분자량은?",["28"],"2×14=28이다.",["분자량","질소"],{answerMode:"number"}),
  q("formula_mass_007","formula_mass",1,"HCl의 분자량은? (H=1, Cl=35.5)",["36.5"],"1+35.5=36.5이다.",["분자량","염화수소"],{answerMode:"number",tolerance:0.01}),
  q("formula_mass_008","formula_mass",1,"NaCl의 화학식량은? (Na=23, Cl=35.5)",["58.5"],"23+35.5=58.5이다.",["화학식량","염화나트륨"],{answerMode:"number",tolerance:0.01}),
  q("formula_mass_009","formula_mass",2,"CaCO₃의 화학식량은? (Ca=40, C=12, O=16)",["100"],"40+12+3×16=100이다.",["화학식량","탄산칼슘"],{answerMode:"number"}),
  q("formula_mass_010","formula_mass",2,"H₂SO₄의 분자량은? (H=1, S=32, O=16)",["98"],"2+32+64=98이다.",["분자량","황산"],{answerMode:"number"}),
  q("formula_mass_011","formula_mass",2,"NaOH의 화학식량은? (Na=23, O=16, H=1)",["40"],"23+16+1=40이다.",["화학식량","수산화나트륨"],{answerMode:"number"}),
  q("formula_mass_012","formula_mass",2,"Ca(OH)₂의 화학식량은?",["74"],"40+2×(16+1)=74이다.",["화학식량","수산화칼슘"],{answerMode:"number"}),
  q("formula_mass_013","formula_mass",2,"C₂H₅OH의 분자량은?",["46"],"2×12+6×1+16=46이다.",["분자량","에탄올"],{answerMode:"number"}),
  q("formula_mass_014","formula_mass",2,"C₆H₁₂O₆(포도당)의 분자량은?",["180"],"6×12+12×1+6×16=180이다.",["분자량","포도당"],{answerMode:"number"}),
  q("formula_mass_015","formula_mass",2,"MgO의 화학식량은? (Mg=24, O=16)",["40"],"24+16=40이다.",["화학식량","산화마그네슘"],{answerMode:"number"}),
  q("formula_mass_016","formula_mass",2,"Al₂O₃의 화학식량은? (Al=27, O=16)",["102"],"2×27+3×16=102이다.",["화학식량","산화알루미늄"],{answerMode:"number"}),
  q("formula_mass_017","formula_mass",3,"Fe₂O₃의 화학식량은? (Fe=56, O=16)",["160"],"2×56+3×16=160이다.",["화학식량","산화철"],{answerMode:"number"}),
  q("formula_mass_018","formula_mass",3,"(NH₄)₂SO₄의 화학식량은?",["132"],"2×14+8×1+32+4×16=132이다.",["화학식량","황산암모늄"],{answerMode:"number"}),
  q("formula_mass_019","formula_mass",3,"CuSO₄의 화학식량은? (Cu=64)",["160"],"64+32+4×16=160이다.",["화학식량","황산구리"],{answerMode:"number"}),
  q("formula_mass_020","formula_mass",3,"Na₂CO₃의 화학식량은?",["106"],"2×23+12+3×16=106이다.",["화학식량","탄산나트륨"],{answerMode:"number"}),

  // 4단계: 몰수·질량
  q("mole_mass_001","mole_mass",1,"H₂O 2 mol의 질량은? (몰질량 18 g/mol)",["36"],"2×18=36 g이다.",["몰","질량","물"],{answerMode:"number",unit:"g",acceptedUnits:["그램"]}),
  q("mole_mass_002","mole_mass",1,"CO₂ 44 g은 몇 mol인가?",["1"],"44÷44=1 mol이다.",["몰","질량","이산화탄소"],{answerMode:"number",unit:"mol",acceptedUnits:["몰"]}),
  q("mole_mass_003","mole_mass",1,"O₂ 0.5 mol의 질량은?",["16"],"0.5×32=16 g이다.",["몰","질량","산소"],{answerMode:"number",unit:"g",acceptedUnits:["그램"]}),
  q("mole_mass_004","mole_mass",1,"NaCl 117 g은 몇 mol인가? (58.5 g/mol)",["2"],"117÷58.5=2 mol이다.",["몰","질량","염화나트륨"],{answerMode:"number",unit:"mol",acceptedUnits:["몰"]}),
  q("mole_mass_005","mole_mass",1,"탄소 C 3 mol의 질량은?",["36"],"3×12=36 g이다.",["몰","질량","탄소"],{answerMode:"number",unit:"g",acceptedUnits:["그램"]}),
  q("mole_mass_006","mole_mass",1,"NH₃ 34 g은 몇 mol인가?",["2"],"34÷17=2 mol이다.",["몰","질량","암모니아"],{answerMode:"number",unit:"mol",acceptedUnits:["몰"]}),
  q("mole_mass_007","mole_mass",1,"CaCO₃ 0.25 mol의 질량은?",["25"],"0.25×100=25 g이다.",["몰","질량","탄산칼슘"],{answerMode:"number",unit:"g",acceptedUnits:["그램"]}),
  q("mole_mass_008","mole_mass",1,"입자 6.02×10²³개는 몇 mol인가?",["1"],"아보가드로수만큼의 입자는 1 mol이다.",["몰","입자수","아보가드로수"],{answerMode:"number",unit:"mol",acceptedUnits:["몰"],tolerance:0.01}),
  q("mole_mass_009","mole_mass",2,"입자 3.01×10²³개는 몇 mol인가?",["0.5"],"아보가드로수의 절반이므로 0.5 mol이다.",["몰","입자수","아보가드로수"],{answerMode:"number",unit:"mol",acceptedUnits:["몰"],tolerance:0.01}),
  q("mole_mass_010","mole_mass",2,"2 mol에 들어 있는 입자 수를 10²³개 단위로 쓰면?",["12.04"],"2×6.02=12.04이므로 12.04×10²³개이다.",["몰","입자수","아보가드로수"],{answerMode:"number",tolerance:0.01}),
  q("mole_mass_011","mole_mass",2,"포도당 90 g은 몇 mol인가? (180 g/mol)",["0.5"],"90÷180=0.5 mol이다.",["몰","질량","포도당"],{answerMode:"number",unit:"mol",acceptedUnits:["몰"],tolerance:0.01}),
  q("mole_mass_012","mole_mass",2,"H₂SO₄ 0.2 mol의 질량은? (98 g/mol)",["19.6"],"0.2×98=19.6 g이다.",["몰","질량","황산"],{answerMode:"number",unit:"g",acceptedUnits:["그램"],tolerance:0.01}),
  q("mole_mass_013","mole_mass",2,"N₂ 7 g은 몇 mol인가? (28 g/mol)",["0.25"],"7÷28=0.25 mol이다.",["몰","질량","질소"],{answerMode:"number",unit:"mol",acceptedUnits:["몰"],tolerance:0.01}),
  q("mole_mass_014","mole_mass",2,"CH₄ 1.5 mol의 질량은?",["24"],"1.5×16=24 g이다.",["몰","질량","메테인"],{answerMode:"number",unit:"g",acceptedUnits:["그램"]}),
  q("mole_mass_015","mole_mass",2,"MgO 80 g은 몇 mol인가?",["2"],"80÷40=2 mol이다.",["몰","질량","산화마그네슘"],{answerMode:"number",unit:"mol",acceptedUnits:["몰"]}),
  q("mole_mass_016","mole_mass",2,"0.1 mol에 들어 있는 입자 수는 몇 개인가?",["6.02e22","6.02×10^22","6.02×10²²"],"0.1×6.02×10²³=6.02×10²²개이다.",["몰","입자수","아보가드로수"]),
  q("mole_mass_017","mole_mass",3,"CuSO₄ 40 g은 몇 mol인가? (160 g/mol)",["0.25"],"40÷160=0.25 mol이다.",["몰","질량","황산구리"],{answerMode:"number",unit:"mol",acceptedUnits:["몰"],tolerance:0.01}),
  q("mole_mass_018","mole_mass",3,"Ca(OH)₂ 1.5 mol의 질량은? (74 g/mol)",["111"],"1.5×74=111 g이다.",["몰","질량","수산화칼슘"],{answerMode:"number",unit:"g",acceptedUnits:["그램"]}),
  q("mole_mass_019","mole_mass",3,"기체 분자 1.204×10²⁴개는 몇 mol인가?",["2"],"1.204×10²⁴÷6.02×10²³=2 mol이다.",["몰","입자수","아보가드로수"],{answerMode:"number",unit:"mol",acceptedUnits:["몰"],tolerance:0.01}),
  q("mole_mass_020","mole_mass",3,"에탄올 4.6 g은 몇 mol인가? (46 g/mol)",["0.1"],"4.6÷46=0.1 mol이다.",["몰","질량","에탄올"],{answerMode:"number",unit:"mol",acceptedUnits:["몰"],tolerance:0.001}),

  // 5단계: 산화수 (부호 유무를 허용하되 설명에는 실제 부호를 명시)
  q("oxidation_number_001","oxidation_number",1,"H₂O에서 O의 산화수 크기는?",["-2"],"산소의 산화수는 -2이다.",["산화수","산소"],{answerMode:"number",signInsensitive:true}),
  q("oxidation_number_002","oxidation_number",1,"NaCl에서 Na의 산화수 크기는?",["+1"],"Na의 산화수는 +1이다.",["산화수","나트륨"],{answerMode:"number",signInsensitive:true}),
  q("oxidation_number_003","oxidation_number",1,"CO₂에서 C의 산화수 크기는?",["+4"],"2개의 O가 -4이므로 C는 +4이다.",["산화수","탄소"],{answerMode:"number",signInsensitive:true}),
  q("oxidation_number_004","oxidation_number",1,"O₂에서 O의 산화수는?",["0"],"홑원소의 산화수는 0이다.",["산화수","홑원소"],{answerMode:"number"}),
  q("oxidation_number_005","oxidation_number",1,"NH₃에서 N의 산화수 크기는?",["-3"],"H가 각각 +1이므로 N은 -3이다.",["산화수","질소"],{answerMode:"number",signInsensitive:true}),
  q("oxidation_number_006","oxidation_number",1,"단원자 이온 Mg²⁺에서 Mg의 산화수 크기는?",["+2"],"단원자 이온의 산화수는 이온 전하와 같다.",["산화수","단원자이온"],{answerMode:"number",signInsensitive:true}),
  q("oxidation_number_007","oxidation_number",1,"Cl⁻에서 Cl의 산화수 크기는?",["-1"],"단원자 이온 Cl⁻의 산화수는 -1이다.",["산화수","단원자이온"],{answerMode:"number",signInsensitive:true}),
  q("oxidation_number_008","oxidation_number",1,"Fe 금속에서 Fe의 산화수는?",["0"],"홑원소 Fe의 산화수는 0이다.",["산화수","홑원소"],{answerMode:"number"}),
  q("oxidation_number_009","oxidation_number",2,"H₂SO₄에서 S의 산화수 크기는?",["+6"],"2(+1)+S+4(-2)=0이므로 S는 +6이다.",["산화수","황"],{answerMode:"number",signInsensitive:true}),
  q("oxidation_number_010","oxidation_number",2,"SO₄²⁻에서 S의 산화수 크기는?",["+6"],"S+4(-2)=-2이므로 S는 +6이다.",["산화수","다원자이온"],{answerMode:"number",signInsensitive:true}),
  q("oxidation_number_011","oxidation_number",2,"NO₃⁻에서 N의 산화수 크기는?",["+5"],"N+3(-2)=-1이므로 N은 +5이다.",["산화수","다원자이온"],{answerMode:"number",signInsensitive:true}),
  q("oxidation_number_012","oxidation_number",2,"MnO₄⁻에서 Mn의 산화수 크기는?",["+7"],"Mn+4(-2)=-1이므로 Mn은 +7이다.",["산화수","다원자이온"],{answerMode:"number",signInsensitive:true}),
  q("oxidation_number_013","oxidation_number",2,"H₂O₂에서 O의 산화수 크기는?",["-1"],"과산화물에서 산소의 산화수는 -1이다.",["산화수","과산화물"],{answerMode:"number",signInsensitive:true}),
  q("oxidation_number_014","oxidation_number",2,"NaH에서 H의 산화수 크기는?",["-1"],"금속 수소화물에서 H의 산화수는 -1이다.",["산화수","수소화물"],{answerMode:"number",signInsensitive:true}),
  q("oxidation_number_015","oxidation_number",2,"KMnO₄에서 Mn의 산화수 크기는?",["+7"],"K(+1)+Mn+4O(-8)=0이므로 Mn은 +7이다.",["산화수","망가니즈"],{answerMode:"number",signInsensitive:true}),
  q("oxidation_number_016","oxidation_number",2,"K₂Cr₂O₇에서 Cr의 산화수 크기는?",["+6"],"2(+1)+2Cr+7(-2)=0이므로 Cr은 +6이다.",["산화수","크로뮴"],{answerMode:"number",signInsensitive:true}),
  q("oxidation_number_017","oxidation_number",3,"S₂O₃²⁻에서 S의 평균 산화수 크기는?",["+2"],"2S+3(-2)=-2이므로 S의 평균은 +2이다.",["산화수","평균산화수"],{answerMode:"number",signInsensitive:true}),
  q("oxidation_number_018","oxidation_number",3,"NH₄⁺에서 N의 산화수 크기는?",["-3"],"N+4(+1)=+1이므로 N은 -3이다.",["산화수","다원자이온"],{answerMode:"number",signInsensitive:true}),
  q("oxidation_number_019","oxidation_number",3,"ClO₃⁻에서 Cl의 산화수 크기는?",["+5"],"Cl+3(-2)=-1이므로 Cl은 +5이다.",["산화수","다원자이온"],{answerMode:"number",signInsensitive:true}),
  q("oxidation_number_020","oxidation_number",3,"Fe₃O₄에서 Fe의 평균 산화수는?",["+8/3","8/3","2.67"],"3Fe+4(-2)=0이므로 Fe의 평균 산화수는 +8/3이다.",["산화수","평균산화수"]),

  // 6단계: 산화·환원 판단
  mc("redox_001","redox",1,"Fe → Fe²⁺ + 2e⁻에서 Fe는?",["산화","환원"],0,"전자를 잃었으므로 산화이다.",["산화환원","전자상실"]),
  mc("redox_002","redox",1,"Cu²⁺ + 2e⁻ → Cu에서 Cu²⁺는?",["산화","환원"],1,"전자를 얻었으므로 환원이다.",["산화환원","전자획득"]),
  mc("redox_003","redox",1,"산화수가 증가하는 변화는?",["산화","환원"],0,"산화수 증가는 산화이다.",["산화환원","산화수변화"]),
  mc("redox_004","redox",1,"전자를 얻는 반응은?",["산화","환원"],1,"전자 획득은 환원이다.",["산화환원","전자획득"]),
  mc("redox_005","redox",1,"환원제 자신이 겪는 변화는?",["산화","환원"],0,"환원제는 상대를 환원시키고 자신은 산화된다.",["산화환원","환원제"]),
  mc("redox_006","redox",1,"산화제 자신이 겪는 변화는?",["산화","환원"],1,"산화제는 상대를 산화시키고 자신은 환원된다.",["산화환원","산화제"]),
  mc("redox_007","redox",1,"Zn + Cu²⁺ → Zn²⁺ + Cu에서 산화되는 물질은?",["Zn","Cu²⁺"],0,"Zn의 산화수가 0에서 +2로 증가한다.",["산화환원","반응식","아연"]),
  mc("redox_008","redox",1,"Zn + Cu²⁺ → Zn²⁺ + Cu에서 환원되는 물질은?",["Zn","Cu²⁺"],1,"Cu의 산화수가 +2에서 0으로 감소한다.",["산화환원","반응식","구리"]),
  mc("redox_009","redox",2,"2Mg + O₂ → 2MgO에서 환원되는 원소는?",["Mg","O"],1,"O의 산화수가 0에서 -2로 감소한다.",["산화환원","반응식","산소"]),
  mc("redox_010","redox",2,"2Mg + O₂ → 2MgO에서 환원제는?",["Mg","O₂"],0,"Mg가 산화되면서 O₂를 환원시킨다.",["산화환원","환원제","마그네슘"]),
  mc("redox_011","redox",2,"Cl₂ + 2Br⁻ → 2Cl⁻ + Br₂에서 산화제는?",["Cl₂","Br⁻"],0,"Cl₂가 전자를 얻어 환원되므로 산화제이다.",["산화환원","산화제","할로젠"]),
  mc("redox_012","redox",2,"Cl₂ + 2Br⁻ → 2Cl⁻ + Br₂에서 산화되는 것은?",["Cl₂","Br⁻"],1,"Br⁻가 전자를 잃어 Br₂가 된다.",["산화환원","반응식","할로젠"]),
  mc("redox_013","redox",2,"Fe₂O₃ + 3CO → 2Fe + 3CO₂에서 Fe₂O₃는?",["산화됨","환원됨"],1,"Fe의 산화수가 +3에서 0으로 감소한다.",["산화환원","반응식","철"]),
  mc("redox_014","redox",2,"Fe₂O₃ + 3CO → 2Fe + 3CO₂에서 CO는?",["산화제","환원제"],1,"CO는 CO₂로 산화되며 Fe₂O₃를 환원시킨다.",["산화환원","환원제","일산화탄소"]),
  mc("redox_015","redox",2,"2H₂ + O₂ → 2H₂O에서 산화되는 원소는?",["H","O"],0,"H의 산화수가 0에서 +1로 증가한다.",["산화환원","반응식","수소"]),
  mc("redox_016","redox",2,"2H₂ + O₂ → 2H₂O에서 산화제는?",["H₂","O₂"],1,"O₂가 환원되므로 산화제이다.",["산화환원","산화제","산소"]),
  mc("redox_017","redox",3,"MnO₄⁻가 Mn²⁺로 변할 때 Mn은?",["산화","환원"],1,"Mn의 산화수가 +7에서 +2로 감소한다.",["산화환원","산화수변화","망가니즈"]),
  mc("redox_018","redox",3,"Cr₂O₇²⁻가 Cr³⁺로 변할 때 필요한 것은?",["전자 획득","전자 방출"],0,"Cr의 산화수가 +6에서 +3으로 감소하므로 전자를 얻는다.",["산화환원","전자획득","크로뮴"]),
  mc("redox_019","redox",3,"2I⁻ → I₂ + 2e⁻ 반쪽 반응은?",["산화 반쪽 반응","환원 반쪽 반응"],0,"전자가 생성물 쪽에 있으므로 산화 반쪽 반응이다.",["산화환원","반쪽반응","아이오딘"]),
  mc("redox_020","redox",3,"NO₃⁻ + 4H⁺ + 3e⁻ → NO + 2H₂O 반쪽 반응은?",["산화 반쪽 반응","환원 반쪽 반응"],1,"전자를 반응물로 받아들이므로 환원 반쪽 반응이다.",["산화환원","반쪽반응","질산이온"])
]);

export function validateQuestions(questions = QUESTIONS) {
  const errors = [];
  const ids = new Set();
  for (const item of questions) {
    if (!item.id || ids.has(item.id)) errors.push(`duplicate id: ${item.id}`);
    ids.add(item.id);
    if (!item.stageId || !item.prompt || !item.type) errors.push(`invalid question: ${item.id}`);
    if (item.type === "multiple_choice" && (!Array.isArray(item.choices) || !Number.isInteger(item.correctChoice))) errors.push(`invalid choices: ${item.id}`);
    if (item.type !== "multiple_choice" && (!Array.isArray(item.answers) || !item.answers.length)) errors.push(`missing answers: ${item.id}`);
  }
  return errors;
}
