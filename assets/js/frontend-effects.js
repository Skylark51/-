(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const visualStates = ['state-idle','state-answer-correct','state-answer-wrong','state-water-warning','state-water-critical','state-stage-clear','state-game-over','state-game-clear','state-paused'];
  let timer = 0;
  function setState(name, transient = false) {
    const stage = $('visualStage'); if (!stage) return;
    stage.classList.remove(...visualStates); stage.classList.add(`state-${name}`);
    if (transient) { clearTimeout(timer); timer = setTimeout(syncWaterState, 900); }
  }
  function snapshot() { return globalThis.KongJuiYaGame?.game?.snapshot?.(); }
  function syncWaterState() {
    const state = snapshot(); const stage = $('visualStage'); if (!state || !stage) return;
    stage.classList.toggle('is-water-low',state.water <= 25);
    if (state.status === 'paused') setState('paused');
    else if (state.status === 'over') setState('game-over');
    else if (state.status === 'cleared') setState('game-clear');
    else if (state.water <= 10) setState('water-critical');
    else if (state.water <= 50) setState('water-warning');
    else setState('idle');
    const waterBar = $('ui-waterMiniBar'); if (waterBar) waterBar.style.width = `${state.water}%`;
    const percent = Math.round(state.correctInStage / state.correctAnswersPerStage * 100); if ($('ui-stagePercent')) $('ui-stagePercent').textContent = `${percent}%`;
    if ($('ui-questionType')) $('ui-questionType').textContent = ['원소 기호 해석','원자량 기억','화학식 계산','몰 관계 계산','산화수 판정','전자 이동 판정'][state.stageIndex] || '화학 문제';
    const pauseLabel = state.status === 'paused' ? '▶ 계속하기' : 'Ⅱ 일시정지';
    for (const id of ['ui-pauseButton','ui-mobilePauseButton']) { const button=$(id); if(button){button.textContent=pauseLabel;button.setAttribute('aria-pressed',String(state.status === 'paused'));} }
  }
  addEventListener('answer:correct', event => { const splash=$('splash'); if(splash) splash.textContent=`💧 +${Math.round(event.detail.waterGain)} · +${event.detail.scoreGain}`; setState('answer-correct',true); });
  addEventListener('answer:wrong',() => setState('answer-wrong',true));
  addEventListener('answer:timeout',() => setState('answer-wrong',true));
  addEventListener('water:warning',syncWaterState); addEventListener('water:critical',syncWaterState);
  addEventListener('game:pause',() => setState('paused')); addEventListener('game:resume',syncWaterState);
  addEventListener('game:start',() => setTimeout(syncWaterState));
  addEventListener('stage:clear',event => { if($('ui-curtainTitle')) $('ui-curtainTitle').textContent=`${event.detail.stage.name} 완료`; if($('ui-curtainText')) $('ui-curtainText').textContent=`학습 주제 완료! 다음 단계는 누수 속도가 더 빨라집니다.`; setState('stage-clear'); setTimeout(syncWaterState,1800); });
  function decorateResult(){const panel=resultPanel;if(!panel||panel.querySelector('.result-card'))return;const card=document.createElement('div');card.className='result-card';while(panel.firstChild)card.append(panel.firstChild);panel.append(card)}
  addEventListener('game:over',() => { if($('ui-curtainTitle')) $('ui-curtainTitle').textContent='장독대가 비었습니다'; if($('ui-curtainText')) $('ui-curtainText').textContent='두꺼비에게 휴식이 필요해요. 다시 도전하세요.'; setState('game-over'); setTimeout(decorateResult); });
  addEventListener('game:clear',() => { if($('ui-curtainTitle')) $('ui-curtainTitle').textContent='모든 관문 완료'; if($('ui-curtainText')) $('ui-curtainText').textContent='콩쥐와 두꺼비가 장독대의 물을 지켜냈습니다.'; setState('game-clear'); setTimeout(decorateResult); });
  function togglePause(){globalThis.KongJuiYaGame?.game?.togglePause();syncWaterState()}
  for(const id of ['ui-pauseButton','ui-mobilePauseButton']) $(id)?.addEventListener('click',togglePause);
  for(const id of ['ui-restartButton','ui-mobileRestartButton']) $(id)?.addEventListener('click',()=>globalThis.KongJuiYaGame?.start?.());
  function observeState(){const stage=visualStage;if(stage&&['state-answer-correct','state-answer-wrong','state-stage-clear'].some(name=>stage.classList.contains(name)))return;syncWaterState()}
  const observer=new MutationObserver(observeState); const water=$('waterValue'); if(water) observer.observe(water,{childList:true,characterData:true,subtree:true});
  addEventListener('DOMContentLoaded',syncWaterState);
})();