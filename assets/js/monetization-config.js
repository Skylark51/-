export const MONETIZATION_CONFIG=Object.freeze({enabled:false,publisherId:"",slots:Object.freeze({lobbyBelowContent:"",guideInline:""})});
export function isMonetizationConfigured(config=MONETIZATION_CONFIG){return Boolean(config?.enabled&&/^ca-pub-\d{16,}$/.test(config.publisherId)&&Object.values(config.slots||{}).some(slot=>/^\d+$/.test(String(slot))))}
