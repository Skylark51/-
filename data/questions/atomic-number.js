import{q}from"./_helpers.js";
const rows=[
["H",1,1],["He",2,1],["Li",3,2],["Be",4,2],["B",5,2],["C",6,1],["N",7,1],["O",8,1],["F",9,1],["Ne",10,1],["Na",11,1],["Mg",12,1],["Al",13,1],["Si",14,1],["P",15,1],["S",16,1],["Cl",17,1],["Ar",18,1],["K",19,1],["Ca",20,1]];
export const atomicNumberQuestions=Object.freeze(rows.map(([symbol,number,difficulty])=>q(`atomic_number_${String(number).padStart(3,"0")}`,"atomic_number",difficulty,`원소 기호 ${symbol}의 원자 번호를 숫자로 입력하세요.`,[String(number)],`${symbol}의 원자 번호는 ${number}입니다.`,["원자 번호",symbol,"1~20"],{type:"numeric",answerMode:"integer",inputMode:"numeric"})));
