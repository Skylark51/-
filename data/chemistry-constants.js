export const ELEMENTS_1_TO_20=Object.freeze(["H","He","Li","Be","B","C","N","O","F","Ne","Na","Mg","Al","Si","P","S","Cl","Ar","K","Ca"]);
export const ATOMIC_NUMBERS=Object.freeze(Object.fromEntries(ELEMENTS_1_TO_20.map((symbol,index)=>[symbol,index+1])));
export const ATOMIC_MASSES=Object.freeze({H:1,He:4,Li:7,C:12,N:14,O:16,F:19,Ne:20,Na:23,Mg:24,Al:27,Si:28,S:32,Cl:35.5,Ar:40,K:39,Ca:40});
export const PERIODS=Object.freeze({H:1,He:1,Li:2,Be:2,B:2,C:2,N:2,O:2,F:2,Ne:2,Na:3,Mg:3,Al:3,Si:3,P:3,S:3,Cl:3,Ar:3,K:4,Ca:4});
export const GROUPS=Object.freeze({H:1,He:18,Li:1,Be:2,B:13,C:14,N:15,O:16,F:17,Ne:18,Na:1,Mg:2,Al:13,Si:14,P:15,S:16,Cl:17,Ar:18,K:1,Ca:2});
export const VALENCE_ELECTRONS=Object.freeze({H:1,He:0,Li:1,Be:2,B:3,C:4,N:5,O:6,F:7,Ne:0,Na:1,Mg:2,Al:3,Si:4,P:5,S:6,Cl:7,Ar:0,K:1,Ca:2});
export const ELECTRONEGATIVITY=Object.freeze({H:2.1,Li:1.0,Be:1.5,B:2.0,C:2.5,N:3.0,O:3.5,F:4.0,Na:0.9,Mg:1.2,Al:1.5,Si:1.8,P:2.1,S:2.5,Cl:3.0,K:0.8,Ca:1.0});
