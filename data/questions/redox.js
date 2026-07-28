import{binary}from"./_choice.js";
const O={label:"산화",value:"oxidation"},R={label:"환원",value:"reduction"},OX={label:"산화제",value:"oxidizing_agent"},RE={label:"환원제",value:"reducing_agent"},UP={label:"산화수 증가",value:"increase"},DOWN={label:"산화수 감소",value:"decrease"},GAIN={label:"전자 획득",value:"gain"},LOSS={label:"전자 상실",value:"loss"};
export const redoxQuestions=Object.freeze([
binary("redox_001","redox",1,"Fe → Fe²⁺ + 2e⁻에서 Fe의 변화는?",O,R,"1","전자를 잃었으므로 산화입니다.",["산화 환원","전자 상실"]),
binary("redox_002","redox",1,"Cu²⁺ + 2e⁻ → Cu에서 Cu²⁺의 변화는?",O,R,"2","전자를 얻었으므로 환원입니다.",["산화 환원","전자 획득"]),
binary("redox_003","redox",1,"산화 과정에서 일어나는 전자 변화는?",GAIN,LOSS,"2","산화는 전자를 잃는 과정입니다.",["산화","전자"]),
binary("redox_004","redox",1,"환원 과정에서 일어나는 전자 변화는?",GAIN,LOSS,"1","환원은 전자를 얻는 과정입니다.",["환원","전자"]),
binary("redox_005","redox",1,"어떤 원자의 산화수가 -1에서 +1로 변했습니다.",O,R,"1","산화수 증가는 산화입니다.",["산화수","산화"]),
binary("redox_006","redox",1,"어떤 원자의 산화수가 +4에서 +2로 변했습니다.",O,R,"2","산화수 감소는 환원입니다.",["산화수","환원"]),
binary("redox_007","redox",2,"산화될 때 해당 원소의 산화수 변화는?",UP,DOWN,"1","산화되면 산화수가 증가합니다.",["산화수","산화"]),
binary("redox_008","redox",2,"환원될 때 해당 원소의 산화수 변화는?",UP,DOWN,"2","환원되면 산화수가 감소합니다.",["산화수","환원"]),
binary("redox_009","redox",2,"다른 물질을 산화시키고 자신은 환원되는 물질은?",OX,RE,"1","다른 물질을 산화시키는 물질이 산화제입니다.",["산화제","정의"]),
binary("redox_010","redox",2,"다른 물질을 환원시키고 자신은 산화되는 물질은?",OX,RE,"2","다른 물질을 환원시키는 물질이 환원제입니다.",["환원제","정의"]),
binary("redox_011","redox",2,"Zn + Cu²⁺ → Zn²⁺ + Cu에서 Zn은?",OX,RE,"2","Zn은 전자를 주고 산화되므로 환원제입니다.",["환원제","반응식"]),
binary("redox_012","redox",2,"Zn + Cu²⁺ → Zn²⁺ + Cu에서 Cu²⁺은?",OX,RE,"1","Cu²⁺은 전자를 받아 환원되므로 산화제입니다.",["산화제","반응식"]),
binary("redox_013","redox",3,"2Mg + O₂ → 2MgO에서 Mg의 변화는?",O,R,"1","Mg의 산화수는 0에서 +2로 증가합니다.",["산화","반응식"]),
binary("redox_014","redox",3,"2Mg + O₂ → 2MgO에서 O₂의 변화는?",O,R,"2","O의 산화수는 0에서 -2로 감소합니다.",["환원","반응식"]),
binary("redox_015","redox",3,"Cl₂ + 2Br⁻ → 2Cl⁻ + Br₂에서 Cl₂은?",OX,RE,"1","Cl₂은 전자를 받아 환원되며 산화제로 작용합니다.",["산화제","할로젠"]),
binary("redox_016","redox",3,"Cl₂ + 2Br⁻ → 2Cl⁻ + Br₂에서 Br⁻은?",OX,RE,"2","Br⁻은 전자를 주고 산화되며 환원제로 작용합니다.",["환원제","할로젠"])
]);
