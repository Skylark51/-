import{q}from"./_helpers.js";
const rows=[
["H",1.0,1],["He",4.0,2],["Li",6.9,2],["Be",9.0,2],["B",10.8,2],["C",12.0,1],["N",14.0,1],["O",16.0,1],["F",19.0,2],["Ne",20.2,2],["Na",23.0,1],["Mg",24.3,1],["Al",27.0,1],["Si",28.1,1],["P",31.0,1],["S",32.1,1],["Cl",35.5,1],["Ar",39.9,2],["K",39.1,1],["Ca",40.1,1]];
export const atomicMassQuestions=Object.freeze(rows.map(([symbol,mass,difficulty],index)=>q(`atomic_mass_${String(index+1).padStart(3,"0")}`,"atomic_mass",difficulty,`원소 ${symbol}의 상대 원자 질량을 소수 첫째 자리까지 입력하세요.`,[String(mass)],`${symbol}의 교육용 상대 원자 질량은 약 ${mass.toFixed(1)}입니다.`,["상대 원자 질량",symbol,"1~20"],{type:"numeric",answerMode:"number",tolerance:.1,inputMode:"decimal"})));
