export const binary=(id,trainingId,difficulty,prompt,left,right,correctKey,explanation,tags=[])=>Object.freeze({
  id,trainingId,difficulty,type:"binary_choice",prompt,
  answers:[String(correctKey)],
  choices:Object.freeze([
    Object.freeze({key:"1",label:left.label,value:left.value}),
    Object.freeze({key:"2",label:right.label,value:right.value})
  ]),
  correctChoice:String(correctKey),autoSubmit:true,inputMode:"binary_choice",allowedKeys:Object.freeze(["1","2"]),
  keyboardShortcuts:Object.freeze(["1","2"]),explanation,tags,sourceLevel:"high_school_chemistry"
});
