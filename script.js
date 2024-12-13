const GSheetURL="Yhttps://docs.google.com/spreadsheets/d/e/2PACX-1vQbq36KXieC6aKe3KfwM7162IGCZE-WAKHJ7xyScSLrvs92G64vp4BkFaAn0ikrObiBY0jZUYX1Ugpz/pub?gid=0&single=true&output=csv";

let allData=[];
let swipedStack=[];
const steps=document.querySelectorAll('.wizard-step');
let currentStep=0;

document.querySelectorAll('.next-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    if(currentStep<steps.length-1){
      steps[currentStep].classList.remove('active');
      currentStep++;
      steps[currentStep].classList.add('active');
    }
  });
});

document.querySelectorAll('.prev-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    if(currentStep>0){
      steps[currentStep].classList.remove('active');
      currentStep--;
      steps[currentStep].classList.add('active');
    }
  });
});

document.querySelector('.finish-btn').addEventListener('click',()=>{
  steps[currentStep].classList.remove('active');
  showResults();
});

setupSelectAll('regionList','regionAll');
setupSelectAll('budgetList','budgetAll');
setupSelectAll('activitiesList','activitiesAll');
setupSelectAll('climateList','climateAll');

async function fetchData(){
  const response=await fetch(GSheetURL);
  const text=await response.text();
  return csvToArray(text);
}

fetchData().then(data=>{
  allData=data;
});

function setupSelectAll(containerId,allId){
  const container=document.getElementById(containerId);
  const allCheck=document.getElementById(allId);
  const checks=[...container.querySelectorAll('input[type=checkbox]')].filter(c=>c!==allCheck);

  allCheck.addEventListener('change',()=>{
    checks.forEach(ch=>{ch.checked=allCheck.checked});
  });

  checks.forEach(ch=>{
    ch.addEventListener('change',()=>{
      if(!ch.checked){
        allCheck.checked=false;
      }else if(checks.every(cc=>cc.checked)){
        allCheck.checked=true;
      }
    });
  });
}

function csvToArray(str,delimiter=","){
  const headers=str.slice(0,str.indexOf("\n")).split(delimiter).map(h=>h.trim());
  const rows=str.slice(str.indexOf("\n")+1).split("\n");
  const arr=rows.map(row=>{
    const values=row.split(delimiter).map(v=>v.trim());
    let obj={};
    headers.forEach((h,i)=>obj[h]=values[i]?values[i]:"");
    return obj;
  }).filter(o=>o.Destination);
  return arr;
}

function getSelectedValues(containerId,allId){
  const container=document.getElementById(containerId);
  const allCheck=document.getElementById(allId);
  const checks=[...container.querySelectorAll('input[type=checkbox]')].filter(c=>c!==allCheck);
  if(allCheck.checked) {
    return checks.map(c=>c.value).filter(v=>v);
  } else {
    return checks.filter(c=>c.checked).map(c=>c.value);
  }
}

function filterData(data,regions,budgets,activities,climates){
  return data.filter(item=>{
    let regionMatch=regions.length===0||item.Region.split(",").map(i=>i.trim()).some(r=>regions.includes(r));
    let budgetMatch=budgets.length===0||item.BudgetLevel.split(",").map(i=>i.trim()).some(b=>budgets.includes(b));
    let activityMatch=activities.length===0||item.Activities.split(",").map(i=>i.trim()).some(a=>activities.includes(a));
    let climateMatch=climates.length===0||item.Climate.split(",").map(i=>i.trim()).some(c=>climates.includes(c));
    return regionMatch&&budgetMatch&&activityMatch&&climateMatch;
  });
}

function showResults(){
  const regions=getSelectedValues('regionList','regionAll');
  const budgets=getSelectedValues('budgetList','budgetAll');
  const activities=getSelectedValues('activitiesList','activitiesAll');
  const climates=getSelectedValues('climateList','climateAll');

  const filtered=filterData(allData,regions,budgets,activities,climates);
  const resultsSection=document.querySelector('.results-section');
  const cardStack=document.getElementById('cardStack');
  const actions=document.querySelector('.actions');
  const wizard=document.querySelector('.wizard');

  cardStack.innerHTML='';
  if(filtered.length===0){
    alert("No matching destinations found!");
    return;
  }

  wizard.style.display='none';
  resultsSection.style.display='flex';
  actions.style.display='flex';

  // Shuffle
  for(let i=filtered.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [filtered[i],filtered[j]]=[filtered[j],filtered[i]];
  }

  filtered.forEach((dest,i)=>{
    const card=document.createElement('div');
    card.classList.add('card');
    card.dataset.destination=dest.Destination;
    card.dataset.region=dest.Region;
    card.dataset.budget=dest.BudgetLevel;
    card.dataset.activities=dest.Activities;
    card.dataset.climate=dest.Climate;
    card.dataset.reflink=dest.Reflink;
    card.style.zIndex=filtered.length-i;
    card.innerHTML=`
      <div class="swipe-overlay"></div>
      <h2>${dest.Destination}</h2>
      <p><strong>Region:</strong> ${dest.Region}<br>
      <strong>Budget:</strong> ${dest.BudgetLevel}<br>
      <strong>Activities:</strong> ${dest.Activities}<br>
      <strong>Climate:</strong> ${dest.Climate}</p>
      <a href="${dest.Reflink}" target="_blank">Book Now</a>
      <div class="swipe-icon left" style="display:none;">
        <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 
        15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 
        3c1.74 0 3.41.81 4.5 2.09C13.09 
        3.81 14.76 3 16.5 3 19.58 3 22 
        5.42 22 8.5c0 3.78-3.4 6.86-8.55 
        11.54L12 21.35z"/></svg>
      </div>
      <div class="swipe-icon right" style="display:none;">
        <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 
        10.59 6.41 5 5 6.41 10.59 12 5 17.59 
        6.41 19 12 13.41 17.59 19 19 17.59 
        13.41 12z"/></svg>
      </div>
    `;

    cardStack.appendChild(card);
    initCard(card);
  });

  document.getElementById('rejectBtn').addEventListener('click',()=>{
    const topCard=getTopCard();
    if(topCard) buttonSwipe(topCard,-1);
  });
  document.getElementById('likeBtn').addEventListener('click',()=>{
    const topCard=getTopCard();
    if(topCard) buttonSwipe(topCard,1);
  });
  document.getElementById('undoBtn').addEventListener('click',()=>{
    undoLastSwipe();
  });
}

function initCard(card){
  let startX=0,currentX=0,dragging=false;
  const overlay=card.querySelector('.swipe-overlay');
  const leftIcon=card.querySelector('.swipe-icon.left');
  const rightIcon=card.querySelector('.swipe-icon.right');

  function updateSwipeVisual(cx){
    const percent = cx/(card.offsetWidth/2);
    const absP = Math.min(Math.abs(percent),1);
    if(percent < 0) {
      // Swipe left -> X on right
      overlay.style.background=`rgba(255,82,82,${absP})`;
      rightIcon.style.display='block';
      rightIcon.style.opacity=absP;
      rightIcon.style.transform=`translateY(-50%) scale(${0.5+absP*0.5})`;
      leftIcon.style.display='none';
    } else if(percent > 0) {
      // Swipe right -> Heart on left
      overlay.style.background=`rgba(76,175,80,${absP})`;
      leftIcon.style.display='block';
      leftIcon.style.opacity=absP;
      leftIcon.style.transform=`translateY(-50%) scale(${0.5+absP*0.5})`;
      rightIcon.style.display='none';
    } else {
      overlay.style.background='transparent';
      leftIcon.style.display='none';
      rightIcon.style.display='none';
    }
  }

  function endSwipe(cx){
    if(cx>100){
      storeCardForUndo(card);
      animateSwipeOut(card,cx,10);
    }else if(cx<-100){
      storeCardForUndo(card);
      animateSwipeOut(card,cx,-10);
    }else{
      card.style.transform=`translate(-50%,-50%)`;
      overlay.style.background='transparent';
      leftIcon.style.display='none';
      rightIcon.style.display='none';
    }
  }

  card.addEventListener('touchstart',e=>{
    dragging=true;
    startX=e.touches[0].clientX;
  });

  card.addEventListener('touchmove',e=>{
    if(!dragging)return;
    currentX=e.touches[0].clientX-startX;
    card.style.transform=`translate(${currentX}px,-50%) rotate(${currentX/20}deg)`;
    updateSwipeVisual(currentX);
  });

  card.addEventListener('touchend',()=>{
    endSwipe(currentX);
    dragging=false;
  });

  card.addEventListener('mousedown',e=>{
    dragging=true;
    startX=e.clientX;
  });

  card.addEventListener('mousemove',e=>{
    if(!dragging)return;
    currentX=e.clientX-startX;
    card.style.transform=`translate(${currentX}px,-50%) rotate(${currentX/20}deg)`;
    updateSwipeVisual(currentX);
  });

  card.addEventListener('mouseup',()=>{
    endSwipe(currentX);
    dragging=false;
  });

  card.addEventListener('mouseleave',()=>{
    if(dragging){
      endSwipe(currentX);
      dragging=false;
    }
  });
}

function storeCardForUndo(card){
  const cardData={
    Destination:card.dataset.destination,
    Region:card.dataset.region,
    BudgetLevel:card.dataset.budget,
    Activities:card.dataset.activities,
    Climate:card.dataset.climate,
    Reflink:card.dataset.reflink
  };
  swipedStack.push(cardData);
}

function undoLastSwipe(){
  if(swipedStack.length===0)return;
  const lastCardData=swipedStack.pop();
  const cardStack=document.getElementById('cardStack');
  const newCard=document.createElement('div');
  newCard.classList.add('card');
  newCard.dataset.destination=lastCardData.Destination;
  newCard.dataset.region=lastCardData.Region;
  newCard.dataset.budget=lastCardData.BudgetLevel;
  newCard.dataset.activities=lastCardData.Activities;
  newCard.dataset.climate=lastCardData.Climate;
  newCard.dataset.reflink=lastCardData.Reflink;

  const cards=[...document.querySelectorAll('.card')];
  let maxZ=0;
  cards.forEach(c=>{
    const z=parseInt(c.style.zIndex)||0;
    if(z>maxZ)maxZ=z;
  });
  newCard.style.zIndex=maxZ+1;

  newCard.innerHTML=`
    <div class="swipe-overlay"></div>
    <h2>${lastCardData.Destination}</h2>
    <p><strong>Region:</strong> ${lastCardData.Region}<br>
    <strong>Budget:</strong> ${lastCardData.BudgetLevel}<br>
    <strong>Activities:</strong> ${lastCardData.Activities}<br>
    <strong>Climate:</strong> ${lastCardData.Climate}</p>
    <a href="${lastCardData.Reflink}" target="_blank">Book Now</a>
    <div class="swipe-icon left" style="display:none;">
      <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 
      15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 
      3c1.74 0 3.41.81 4.5 2.09C13.09 
      3.81 14.76 3 16.5 3 19.58 3 22 
      5.42 22 8.5c0 3.78-3.4 6.86-8.55 
      11.54L12 21.35z"/></svg>
    </div>
    <div class="swipe-icon right" style="display:none;">
      <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 
      10.59 6.41 5 5 6.41 10.59 12 5 17.59 
      6.41 19 12 13.41 17.59 19 19 17.59 
      13.41 12z"/></svg>
    </div>
  `;
  cardStack.appendChild(newCard);
  initCard(newCard);
}

function getTopCard(){
  const cards=[...document.querySelectorAll('.card')];
  if(cards.length===0)return null;
  return cards.reduce((top,c)=>{
    return parseInt(c.style.zIndex)>parseInt(top.style.zIndex)?c:top;
  });
}

function buttonSwipe(card,direction){
  // direction: -1 for left(X), 1 for right(heart)
  storeCardForUndo(card);
  animateSwipeOut(card,0,direction*20);
}

function animateSwipeOut(card,startX,step){
  let currentX=startX;
  const overlay=card.querySelector('.swipe-overlay');
  const leftIcon=card.querySelector('.swipe-icon.left');
  const rightIcon=card.querySelector('.swipe-icon.right');

  function updateSwipeVisual(cx){
    const percent = cx/(card.offsetWidth/2);
    const absP = Math.min(Math.abs(percent),1);
    if(percent < 0) {
      overlay.style.background=`rgba(255,82,82,${absP})`;
      rightIcon.style.display='block';
      rightIcon.style.opacity=absP;
      rightIcon.style.transform=`translateY(-50%) scale(${0.5+absP*0.5})`;
      leftIcon.style.display='none';
    } else if(percent > 0) {
      overlay.style.background=`rgba(76,175,80,${absP})`;
      leftIcon.style.display='block';
      leftIcon.style.opacity=absP;
      leftIcon.style.transform=`translateY(-50%) scale(${0.5+absP*0.5})`;
      rightIcon.style.display='none';
    }
  }

  function animate(){
    currentX+=step;
    card.style.transform=`translate(${currentX}px,-50%) rotate(${currentX/20}deg)`;
    updateSwipeVisual(currentX);
    if(Math.abs(currentX)>1000){
      card.remove(); 
    } else {
      requestAnimationFrame(animate);
    }
  }
  requestAnimationFrame(animate);
}
