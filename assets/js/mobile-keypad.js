const NUMBERS=["1","2","3","4","5","6","7","8","9",".","0"];
const SIGNED=["+","-","1","2","3","4","5","6","7","8","0"];
const mobile=()=>document.documentElement.dataset.deviceLayout==="mobile";

export function mountMobileKeypad({api,form,input,anchor=form}={}){
 if(!api||!form||!input)return null;
 const panel=document.createElement("section");panel.id="ui-mobileKeypad";panel.className="mobile-keypad";
 panel.setAttribute("aria-label","화면 정답 키패드");panel.hidden=true;
 panel.innerHTML='<output class="keypad-display" aria-live="polite" aria-label="입력한 정답">정답을 입력하세요</output><div class="keypad-keys"></div><div class="keypad-actions"></div>';
 anchor.insertAdjacentElement("afterend",panel);
 const output=panel.querySelector("output"),keys=panel.querySelector(".keypad-keys"),actions=panel.querySelector(".keypad-actions");
 let locked=false,currentQuestion=null;
 const showValue=()=>{output.value=input.value;output.textContent=input.value||"정답을 입력하세요"};
 const edit=value=>{if(locked)return;if(value==="backspace")input.value=input.value.slice(0,-1);else if(value==="clear")input.value="";else if(value==="."&&input.value.includes("."))return;else if((value==="+"||value==="-")&&input.value.length)input.value=value+input.value.replace(/^[+-]/,"");else input.value+=value;input.dispatchEvent(new Event("input",{bubbles:true}));showValue()};
 const submit=value=>{if(locked)return;locked=true;try{if(value!=null)api.submit(value);else form.requestSubmit()}finally{setTimeout(()=>{locked=false;input.value="";showValue()},320)}};
 const button=(label,value,kind="key")=>{const element=document.createElement("button");element.type="button";element.className=`keypad-${kind}`;element.textContent=label;element.setAttribute("aria-label",label==="⌫"?"한 글자 지우기":label==="전체 지우기"?label:`정답 ${label}`);if(kind==="submit")element.addEventListener("click",()=>submit());else if(kind!=="choice")element.addEventListener("click",()=>edit(value));return element};
 function renderChoice(descriptor){keys.className="keypad-keys is-choice";for(const choice of descriptor.choices||[]){const b=button(`${choice.key}. ${choice.label}`,choice.key,"choice");b.onclick=()=>descriptor.autoSubmit!==false?submit(choice.key):edit(choice.key);keys.append(b)}}
 function renderNumeric(signed=false){keys.className=`keypad-keys ${signed?"is-signed":"is-numeric"}`;const values=signed?SIGNED:NUMBERS;for(const value of values){const b=button(value,value);if(value==="."&&!(currentQuestion?.tolerance!=null||currentQuestion?.allowedKeys?.includes("."))){b.disabled=true;b.hidden=true}keys.append(b)}keys.append(button("⌫","backspace"),button("전체 지우기","clear"));const send=button("정답 제출",null,"submit");actions.append(send)}
 function render(){currentQuestion=api.game.question;const descriptor=api.game.snapshot().questionInput||{},choice=descriptor.inputMode==="choice";panel.hidden=!mobile();keys.replaceChildren();actions.replaceChildren();input.hidden=mobile()&&(choice||["numeric","decimal"].includes(descriptor.inputMode));if(!mobile()){showValue();return}if(choice)renderChoice(descriptor);else{const signed=currentQuestion?.inputMode==="signed_numeric_keypad"||currentQuestion?.allowedKeys?.includes("-")||currentQuestion?.trainingId==="oxidation_number";renderNumeric(signed)}showValue()}
 addEventListener("question:changed",render);addEventListener("ui:device-mode",render);input.addEventListener("input",showValue);render();
 return{panel,render,destroy(){panel.remove()}};
}
