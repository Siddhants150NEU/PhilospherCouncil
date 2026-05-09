import { useState, useRef, useEffect } from "react";

// ── SOUND ENGINE ──────────────────────────────────────────────────────────────
function createAmbience(audioCtx, key) {
  const gainMaster = audioCtx.createGain();
  gainMaster.gain.setValueAtTime(0, audioCtx.currentTime);
  gainMaster.connect(audioCtx.destination);
  const allNodes = [];
  function makeBrownNoise() {
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
    const ch = buf.getChannelData(0); let last = 0;
    for (let i = 0; i < ch.length; i++) { const w = Math.random()*2-1; last=(last+0.02*w)/1.02; ch[i]=last*3.5; }
    const src = audioCtx.createBufferSource(); src.buffer = buf; src.loop = true; return src;
  }
  function makeWhiteNoise() {
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate*2, audioCtx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random()*2-1;
    const src = audioCtx.createBufferSource(); src.buffer = buf; src.loop = true; return src;
  }
  function makeOsc(freq, type, gainVal) {
    const o = audioCtx.createOscillator(); o.type = type; o.frequency.value = freq;
    const g = audioCtx.createGain(); g.gain.value = gainVal; o.connect(g); return { oscNode: o, gainNode: g };
  }
  function makeTick(interval) {
    const t = setInterval(() => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = "square"; o.frequency.value = 1200;
      g.gain.setValueAtTime(0.06, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      o.connect(g); g.connect(gainMaster); o.start(); o.stop(audioCtx.currentTime + 0.05);
    }, interval);
    allNodes.push({ stop: () => clearInterval(t) });
  }
  function makeTypewriter(ms) {
    const t = setInterval(() => {
      const c = Math.floor(3 + Math.random() * 8);
      for (let ti = 0; ti < c; ti++) {
        setTimeout(() => {
          const o = audioCtx.createOscillator(), g = audioCtx.createGain();
          o.type = "square"; o.frequency.value = 600 + Math.random() * 300;
          g.gain.setValueAtTime(0.04, audioCtx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
          o.connect(g); g.connect(gainMaster); o.start(); o.stop(audioCtx.currentTime + 0.06);
        }, ti * 80 + Math.random() * 40);
      }
    }, ms);
    allNodes.push({ stop: () => clearInterval(t) });
  }
  function addNoise(n, ft, ff, fq, gv) {
    const f = audioCtx.createBiquadFilter(); f.type = ft; f.frequency.value = ff; if (fq) f.Q.value = fq;
    const g = audioCtx.createGain(); g.gain.value = gv; n.connect(f); f.connect(g); g.connect(gainMaster); n.start(); allNodes.push(n, g);
  }
  if (key==="camus") { addNoise(makeBrownNoise(),"bandpass",600,0.8,0.04); [220,330,440,550].forEach((fr,i)=>{ const {oscNode,gainNode}=makeOsc(fr,"sine",0.008+i*0.002); gainNode.connect(gainMaster); oscNode.start(); allNodes.push(oscNode,gainNode); }); }
  else if (key==="kafka") { addNoise(makeBrownNoise(),"highpass",400,null,0.025); makeTick(900); }
  else if (key==="dostoevsky") { addNoise(makeBrownNoise(),"lowpass",300,null,0.06); addNoise(makeWhiteNoise(),"bandpass",150,0.3,0.015); }
  else if (key==="hemingway") { const wn=makeBrownNoise(),wf=audioCtx.createBiquadFilter(),wg=audioCtx.createGain(); wf.type="lowpass"; wf.frequency.value=500; wg.gain.value=0.07; wn.connect(wf); wf.connect(wg); wg.connect(gainMaster); wn.start(); allNodes.push(wn,wg); const {oscNode:lo,gainNode:lg}=makeOsc(0.15,"sine",0.03); lo.connect(lg); lg.connect(wg.gain); lo.start(); allNodes.push(lo,lg); }
  else if (key==="thompson") { addNoise(makeWhiteNoise(),"bandpass",800,0.5,0.03); makeTypewriter(200); }
  else if (key==="socrates") { addNoise(makeBrownNoise(),"bandpass",400,0.4,0.03); [180,270,360].forEach(fr=>{ const {oscNode,gainNode}=makeOsc(fr,"sine",0.005); gainNode.connect(gainMaster); oscNode.start(); allNodes.push(oscNode,gainNode); }); }
  else if (key==="nietzsche") { const wn=makeBrownNoise(),wf=audioCtx.createBiquadFilter(),wg=audioCtx.createGain(); wf.type="bandpass"; wf.frequency.value=200; wf.Q.value=0.3; wg.gain.value=0.08; wn.connect(wf); wf.connect(wg); wg.connect(gainMaster); wn.start(); allNodes.push(wn,wg); const {oscNode:lo,gainNode:lg}=makeOsc(0.08,"sine",0.05); lo.connect(lg); lg.connect(wg.gain); lo.start(); allNodes.push(lo,lg); }
  else if (key==="jung") { addNoise(makeBrownNoise(),"lowpass",200,null,0.025); const {oscNode:d1,gainNode:g1}=makeOsc(55,"sine",0.04); g1.connect(gainMaster); d1.start(); allNodes.push(d1,g1); const {oscNode:d2,gainNode:g2}=makeOsc(110,"sine",0.02); g2.connect(gainMaster); d2.start(); allNodes.push(d2,g2); }
  else if (key==="twain") { const rn=makeBrownNoise(),rf=audioCtx.createBiquadFilter(),rg=audioCtx.createGain(); rf.type="lowpass"; rf.frequency.value=400; rg.gain.value=0.05; rn.connect(rf); rf.connect(rg); rg.connect(gainMaster); rn.start(); allNodes.push(rn,rg); const pt=setInterval(()=>{ const o=audioCtx.createOscillator(),g=audioCtx.createGain(); o.type="sawtooth"; o.frequency.value=80+Math.random()*20; g.gain.setValueAtTime(0.04,audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+0.3); o.connect(g); g.connect(gainMaster); o.start(); o.stop(audioCtx.currentTime+0.3); },600); allNodes.push({stop:()=>clearInterval(pt)}); }
  else if (key==="austen") { addNoise(makeBrownNoise(),"bandpass",500,0.6,0.02); [523,659,784,1047].forEach((fr,i)=>{ const {oscNode,gainNode}=makeOsc(fr,"sine",0.006); const eg=audioCtx.createGain(); eg.gain.value=0; gainNode.connect(eg); eg.connect(gainMaster); oscNode.start(); allNodes.push(oscNode,gainNode,eg); const et=setInterval(()=>{ eg.gain.setValueAtTime(0.006,audioCtx.currentTime); eg.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+1.5); },3000+i*700); allNodes.push({stop:()=>clearInterval(et)}); }); }
  else if (key==="plath") { addNoise(makeBrownNoise(),"bandpass",300,0.4,0.02); const {oscNode:hum,gainNode:hg}=makeOsc(60,"sine",0.035); hg.connect(gainMaster); hum.start(); allNodes.push(hum,hg); makeTypewriter(2500); }
  else if (key==="carlin") { addNoise(makeBrownNoise(),"bandpass",700,0.6,0.04); const {oscNode:mh,gainNode:mg}=makeOsc(60,"sine",0.03); mg.connect(gainMaster); mh.start(); allNodes.push(mh,mg); }
  else if (key==="freud") {
    // Ticking clock — the 50-minute analytic hour
    makeTick(1000);
    // Warm consulting-room drone
    addNoise(makeBrownNoise(),"lowpass",250,null,0.025);
    const {oscNode:fh,gainNode:fg}=makeOsc(80,"sine",0.018);
    fg.connect(gainMaster); fh.start(); allNodes.push(fh,fg);
  }
  return {
    fadeIn(d) { gainMaster.gain.linearRampToValueAtTime(1, audioCtx.currentTime + (d || 1.5)); },
    fadeOut(d) { gainMaster.gain.linearRampToValueAtTime(0, audioCtx.currentTime + (d || 1)); },
    stop() { allNodes.forEach(n => { try { if (n.stop) n.stop(); else if (n.disconnect) n.disconnect(); } catch(e) {} }); }
  };
}

// ── SVG BODIES — each function is multiline to avoid transpiler issues ─────────
function CamusBody({ gesture, size }) {
  gesture = gesture || "idle";
  size = size || 180;
  const aL = gesture==="speak" ? "M37 93 Q19 104 16 123" : gesture==="point" ? "M37 93 Q21 82 12 68" : "M37 93 Q31 111 33 127";
  const aR = gesture==="speak" ? "M63 93 Q81 104 84 123" : gesture==="point" ? "M63 93 Q79 80 88 66" : "M63 93 Q69 111 67 127";
  return (
    <svg width={size} height={size*1.5} viewBox="0 0 100 150" fill="none">
      <rect x="39" y="117" width="10" height="29" rx="3" fill="#18182a"/>
      <rect x="51" y="117" width="10" height="29" rx="3" fill="#18182a"/>
      <ellipse cx="44" cy="146" rx="7" ry="3" fill="#0e0e18"/>
      <ellipse cx="56" cy="146" rx="7" ry="3" fill="#0e0e18"/>
      <path d="M30 80 Q31 75 50 73 Q69 75 70 80 L72 117 Q60 121 50 119 Q40 121 28 117Z" fill="#1a1a28"/>
      <path d="M50 73 L43 89 L50 83 L57 89Z" fill="#f2f0ea"/>
      <path d="M43 73 Q36 80 34 95" stroke="#13131f" strokeWidth="2.5" fill="none"/>
      <path d="M57 73 Q64 80 66 95" stroke="#13131f" strokeWidth="2.5" fill="none"/>
      <path d={aL} stroke="#1a1a28" strokeWidth="9" strokeLinecap="round" fill="none"/>
      <path d={aR} stroke="#1a1a28" strokeWidth="9" strokeLinecap="round" fill="none"/>
      <ellipse cx="15" cy="124" rx="5" ry="3.5" fill="#c8906a" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="85" cy="124" rx="5" ry="3.5" fill="#c8906a" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="11" cy="69" rx="4" ry="3" fill="#c8906a" opacity={gesture==="point"?1:0}/>
      <ellipse cx="89" cy="67" rx="4" ry="3" fill="#c8906a" opacity={gesture==="point"?1:0}/>
      <ellipse cx="32" cy="128" rx="4" ry="3" fill="#c8906a" opacity={gesture==="idle"?1:0}/>
      <ellipse cx="68" cy="128" rx="4" ry="3" fill="#c8906a" opacity={gesture==="idle"?1:0}/>
      <rect x="44" y="65" width="12" height="13" rx="5" fill="#c8906a"/>
      <path d="M29 49 Q29 26 50 22 Q71 26 71 49 Q72 62 65 70 Q58 76 50 77 Q42 76 35 70 Q28 62 29 49Z" fill="#c8906a"/>
      <path d="M29 47 Q30 22 50 20 Q70 22 71 47 Q65 28 50 29 Q35 28 29 47Z" fill="#180e06"/>
      <path d="M29 50 Q25 49 24 54 Q24 60 28 62 Q30 60 30 55Z" fill="#c8906a"/>
      <path d="M71 50 Q75 49 76 54 Q76 60 72 62 Q70 60 70 55Z" fill="#c8906a"/>
      <ellipse cx="41" cy="50" rx="5" ry="3.5" fill="#fff"/>
      <ellipse cx="59" cy="50" rx="5" ry="3.5" fill="#fff"/>
      <path d="M36 47 Q41 45 46 47" stroke="#180e06" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      <path d="M54 47 Q59 45 64 47" stroke="#180e06" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      <ellipse cx="41" cy="51" rx="3" ry="2.5" fill="#180e06"/>
      <ellipse cx="59" cy="51" rx="3" ry="2.5" fill="#180e06"/>
      <circle cx="42" cy="50" r="1" fill="#fff"/>
      <circle cx="60" cy="50" r="1" fill="#fff"/>
      <path d="M37 45 Q41 42.5 45 44" stroke="#180e06" strokeWidth="1.4" fill="none"/>
      <path d="M55 44 Q59 42.5 63 45" stroke="#180e06" strokeWidth="1.4" fill="none"/>
      <line x1="50" y1="53" x2="50" y2="62" stroke="#b07040" strokeWidth="1.3"/>
      <path d="M47 62 Q50 64 53 62" stroke="#b07040" strokeWidth="1.2" fill="none"/>
      <path d="M44 68 Q47 71 50 70 Q53 71 56 68" stroke="#9a5838" strokeWidth="1.5" fill="none"/>
      <line x1="55" y1="68" x2="70" y2="63" stroke="#eee8d0" strokeWidth="2.2"/>
      <rect x="69" y="61" width="7" height="3" rx="1.5" fill="#eee8d0"/>
      <circle cx="77" cy="62.5" r="2" fill="#ff5500" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.6;1;0.9" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      <path d="M77 61 Q79 55 77 50" stroke="#ddd" strokeWidth="0.9" opacity="0.5" fill="none">
        <animate attributeName="d" values="M77 61 Q79 55 77 50;M77 61 Q75 54 78 49;M77 61 Q80 54 76 50;M77 61 Q79 55 77 50" dur="2s" repeatCount="indefinite"/>
      </path>
    </svg>
  );
}

function KafkaBody({ gesture, size }) {
  gesture = gesture || "idle";
  size = size || 180;
  const aL = gesture==="speak" ? "M34 97 Q15 106 12 124" : gesture==="point" ? "M34 97 Q17 85 9 71" : "M34 97 Q27 117 29 133";
  const aR = gesture==="speak" ? "M66 97 Q81 104 84 122" : gesture==="point" ? "M66 97 Q83 83 91 69" : "M66 97 Q73 117 71 133";
  return (
    <svg width={size} height={size*1.5} viewBox="0 0 100 150" fill="none">
      <rect x="39" y="121" width="9" height="25" rx="3" fill="#1c1c2e"/>
      <rect x="52" y="121" width="9" height="25" rx="3" fill="#1c1c2e"/>
      <ellipse cx="43" cy="146" rx="6" ry="2.5" fill="#111"/>
      <ellipse cx="57" cy="146" rx="6" ry="2.5" fill="#111"/>
      <path d="M31 83 Q32 78 50 76 Q68 78 69 83 L70 121 Q58 125 50 123 Q42 125 30 121Z" fill="#1e2030"/>
      <path d="M50 76 L43 92 L50 85 L57 92Z" fill="#e0e0e0"/>
      <rect x="45" y="75" width="4" height="8" fill="#f0f0f0"/>
      <rect x="51" y="75" width="4" height="8" fill="#f0f0f0"/>
      <path d="M50 83 L47 98 L50 102 L53 98Z" fill="#6b0f0f"/>
      <path d={aL} stroke="#1e2030" strokeWidth="8" strokeLinecap="round" fill="none"/>
      <path d={aR} stroke="#1e2030" strokeWidth="8" strokeLinecap="round" fill="none"/>
      <ellipse cx="11" cy="125" rx="5" ry="3.5" fill="#c0a07a" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="85" cy="123" rx="5" ry="3.5" fill="#c0a07a" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="8" cy="72" rx="4" ry="3" fill="#c0a07a" opacity={gesture==="point"?1:0}/>
      <ellipse cx="92" cy="70" rx="4" ry="3" fill="#c0a07a" opacity={gesture==="point"?1:0}/>
      <ellipse cx="28" cy="134" rx="4" ry="3" fill="#c0a07a" opacity={gesture==="idle"?1:0}/>
      <ellipse cx="72" cy="134" rx="4" ry="3" fill="#c0a07a" opacity={gesture==="idle"?1:0}/>
      <rect x="45" y="57" width="10" height="24" rx="4" fill="#c0a07a"/>
      <path d="M34 50 Q34 20 50 16 Q66 20 66 50 Q66 68 59 74 Q54 78 50 78 Q46 78 41 74 Q34 68 34 50Z" fill="#c0a07a"/>
      <ellipse cx="36" cy="54" rx="3" ry="7" fill="#8a6040" opacity="0.35"/>
      <ellipse cx="64" cy="54" rx="3" ry="7" fill="#8a6040" opacity="0.35"/>
      <path d="M34 48 Q35 16 50 14 Q65 16 66 48 Q60 24 50 25 Q40 24 34 48Z" fill="#0a0a18"/>
      <path d="M33 46 Q18 42 16 54 Q14 66 20 70 Q26 72 33 65 Q30 58 33 51Z" fill="#c0a07a"/>
      <path d="M67 46 Q82 42 84 54 Q86 66 80 70 Q74 72 67 65 Q70 58 67 51Z" fill="#c0a07a"/>
      <ellipse cx="41" cy="47" rx="6.5" ry="6" fill="#fff"/>
      <ellipse cx="59" cy="47" rx="6.5" ry="6" fill="#fff"/>
      <ellipse cx="41" cy="47" rx="4.2" ry="4.2" fill="#10101e"/>
      <ellipse cx="59" cy="47" rx="4.2" ry="4.2" fill="#10101e"/>
      <circle cx="42.5" cy="45.5" r="1.5" fill="#fff"/>
      <circle cx="60.5" cy="45.5" r="1.5" fill="#fff"/>
      <path d="M34 39 Q41 36 47 38.5" stroke="#0a0a18" strokeWidth="1.6" fill="none"/>
      <path d="M53 38.5 Q59 36 66 39" stroke="#0a0a18" strokeWidth="1.6" fill="none"/>
      <path d="M48 52 Q46 62 48 67" stroke="#9a7050" strokeWidth="1.4" fill="none"/>
      <path d="M52 52 Q54 62 52 67" stroke="#9a7050" strokeWidth="1.4" fill="none"/>
      <path d="M47 67 Q50 70 53 67" stroke="#9a7050" strokeWidth="1.3" fill="none"/>
      <path d="M44 72 Q47 73.5 50 73 Q53 73.5 56 72" stroke="#8a5838" strokeWidth="1.3" fill="none"/>
    </svg>
  );
}

function DostoevskyBody({ gesture, size }) {
  gesture = gesture || "idle";
  size = size || 180;
  const aL = gesture==="speak" ? "M33 92 Q14 101 11 119" : gesture==="point" ? "M33 92 Q16 81 8 68" : "M33 92 Q26 112 28 129";
  const aR = gesture==="speak" ? "M67 92 Q86 98 90 115" : gesture==="point" ? "M67 92 Q85 79 94 66" : "M67 92 Q74 112 72 129";
  return (
    <svg width={size} height={size*1.5} viewBox="0 0 100 150" fill="none">
      <rect x="37" y="118" width="11" height="28" rx="4" fill="#100808"/>
      <rect x="52" y="118" width="11" height="28" rx="4" fill="#100808"/>
      <ellipse cx="42" cy="146" rx="7" ry="3" fill="#080404"/>
      <ellipse cx="58" cy="146" rx="7" ry="3" fill="#080404"/>
      <path d="M25 79 Q27 74 50 72 Q73 74 75 79 L77 118 Q62 124 50 122 Q38 124 23 118Z" fill="#100808"/>
      <line x1="50" y1="74" x2="50" y2="118" stroke="#1a1010" strokeWidth="1.5"/>
      <circle cx="50" cy="85" r="1.8" fill="#1a1010"/>
      <circle cx="50" cy="97" r="1.8" fill="#1a1010"/>
      <circle cx="50" cy="109" r="1.8" fill="#1a1010"/>
      <path d="M50 72 L43 87 L50 80 L57 87Z" fill="#181010"/>
      <path d={aL} stroke="#100808" strokeWidth="11" strokeLinecap="round" fill="none"/>
      <path d={aR} stroke="#100808" strokeWidth="11" strokeLinecap="round" fill="none"/>
      <ellipse cx="10" cy="120" rx="6" ry="4" fill="#c89868" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="91" cy="116" rx="6" ry="4" fill="#c89868" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="7" cy="69" rx="4" ry="3" fill="#c89868" opacity={gesture==="point"?1:0}/>
      <ellipse cx="95" cy="67" rx="4" ry="3" fill="#c89868" opacity={gesture==="point"?1:0}/>
      <ellipse cx="27" cy="130" rx="4" ry="3" fill="#c89868" opacity={gesture==="idle"?1:0}/>
      <ellipse cx="73" cy="130" rx="4" ry="3" fill="#c89868" opacity={gesture==="idle"?1:0}/>
      <rect x="43" y="63" width="14" height="13" rx="5" fill="#c89868"/>
      <path d="M26 50 Q26 24 50 20 Q74 24 74 50 Q74 65 65 72 Q57 77 50 77 Q43 77 35 72 Q26 65 26 50Z" fill="#c89868"/>
      <path d="M26 47 Q27 20 50 18 Q73 20 74 47 Q67 24 50 25 Q33 24 26 47Z" fill="#201808"/>
      <path d="M26 47 Q22 54 25 66" stroke="#281a08" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
      <path d="M74 47 Q78 54 75 66" stroke="#281a08" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
      <ellipse cx="26" cy="52" rx="4.5" ry="6" fill="#c89868"/>
      <ellipse cx="74" cy="52" rx="4.5" ry="6" fill="#c89868"/>
      <ellipse cx="40" cy="47" rx="5.5" ry="4.5" fill="#fff"/>
      <ellipse cx="60" cy="47" rx="5.5" ry="4.5" fill="#fff"/>
      <ellipse cx="40" cy="43.5" rx="6" ry="3" fill="#8a5828" opacity="0.5"/>
      <ellipse cx="60" cy="43.5" rx="6" ry="3" fill="#8a5828" opacity="0.5"/>
      <ellipse cx="40" cy="47.5" rx="3.5" ry="3.2" fill="#180800"/>
      <ellipse cx="60" cy="47.5" rx="3.5" ry="3.2" fill="#180800"/>
      <circle cx="41" cy="46" r="1.1" fill="#fff"/>
      <circle cx="61" cy="46" r="1.1" fill="#fff"/>
      <path d="M33 41 Q40 38 47 40" stroke="#201808" strokeWidth="3" fill="none"/>
      <path d="M53 40 Q60 38 67 41" stroke="#201808" strokeWidth="3" fill="none"/>
      <path d="M32 64 Q34 60 40 59 Q50 58 60 59 Q66 60 68 64 Q66 76 60 82 Q54 87 50 87 Q46 87 40 82 Q34 76 32 64Z" fill="#201808"/>
      <path d="M40 63 Q50 61 60 63" stroke="#181008" strokeWidth="2.2" fill="none"/>
    </svg>
  );
}

function HemingwayBody({ gesture, size }) {
  gesture = gesture || "idle";
  size = size || 180;
  const aL = gesture==="speak" ? "M32 90 Q14 101 11 119" : gesture==="point" ? "M32 90 Q16 79 8 66" : "M32 90 Q25 111 27 127";
  const aR = gesture==="speak" ? "M68 90 Q86 101 89 119" : gesture==="point" ? "M68 90 Q84 78 92 65" : "M68 90 Q75 111 73 127";
  return (
    <svg width={size} height={size*1.5} viewBox="0 0 100 150" fill="none">
      <rect x="37" y="118" width="12" height="28" rx="4" fill="#32220e"/>
      <rect x="51" y="118" width="12" height="28" rx="4" fill="#32220e"/>
      <ellipse cx="43" cy="146" rx="9" ry="3.5" fill="#180e04"/>
      <ellipse cx="57" cy="146" rx="9" ry="3.5" fill="#180e04"/>
      <path d="M24 78 Q25 73 50 71 Q75 73 76 78 L78 118 Q62 123 50 121 Q38 123 22 118Z" fill="#3e3020"/>
      <path d="M38 73 Q38 66 50 65 Q62 66 62 73 Q62 78 50 78 Q38 78 38 73Z" fill="#4e4030"/>
      <path d={aL} stroke="#3e3020" strokeWidth="12" strokeLinecap="round" fill="none"/>
      <path d={aR} stroke="#3e3020" strokeWidth="12" strokeLinecap="round" fill="none"/>
      <ellipse cx="10" cy="120" rx="6.5" ry="4" fill="#b87840" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="90" cy="120" rx="6.5" ry="4" fill="#b87840" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="7" cy="67" rx="4.5" ry="3" fill="#b87840" opacity={gesture==="point"?1:0}/>
      <ellipse cx="93" cy="66" rx="4.5" ry="3" fill="#b87840" opacity={gesture==="point"?1:0}/>
      <ellipse cx="26" cy="128" rx="4.5" ry="3" fill="#b87840" opacity={gesture==="idle"?1:0}/>
      <ellipse cx="74" cy="128" rx="4.5" ry="3" fill="#b87840" opacity={gesture==="idle"?1:0}/>
      <rect x="42" y="59" width="16" height="12" rx="5" fill="#b87840"/>
      <path d="M23 49 Q23 24 50 19 Q77 24 77 49 Q77 65 67 72 Q58 77 50 77 Q42 77 33 72 Q23 65 23 49Z" fill="#b87840"/>
      <path d="M23 45 Q24 17 50 15 Q76 17 77 45 Q70 20 50 21 Q30 20 23 45Z" fill="#e0d8ce"/>
      <path d="M23 45 Q18 53 20 67" stroke="#e0d8ce" strokeWidth="6" strokeLinecap="round" fill="none"/>
      <path d="M77 45 Q82 53 80 67" stroke="#e0d8ce" strokeWidth="6" strokeLinecap="round" fill="none"/>
      <path d="M23 51 Q17 49 16 57 Q16 65 22 68 Q25 66 25 59Z" fill="#b87840"/>
      <path d="M77 51 Q83 49 84 57 Q84 65 78 68 Q75 66 75 59Z" fill="#b87840"/>
      <ellipse cx="39" cy="47" rx="6" ry="3.5" fill="#fff"/>
      <ellipse cx="61" cy="47" rx="6" ry="3.5" fill="#fff"/>
      <path d="M33 44 Q39 42 45 44" stroke="#a07828" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      <path d="M55 44 Q61 42 67 44" stroke="#a07828" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      <ellipse cx="39" cy="47.5" rx="3.5" ry="2.5" fill="#1e1008"/>
      <ellipse cx="61" cy="47.5" rx="3.5" ry="2.5" fill="#1e1008"/>
      <circle cx="40" cy="46.5" r="1" fill="#fff"/>
      <circle cx="62" cy="46.5" r="1" fill="#fff"/>
      <path d="M32 41 Q39 37 46 40" stroke="#d8d0c4" strokeWidth="3.5" fill="none"/>
      <path d="M54 40 Q61 37 68 41" stroke="#d8d0c4" strokeWidth="3.5" fill="none"/>
      <ellipse cx="50" cy="62" rx="6" ry="3" fill="#9a6828" opacity="0.5"/>
      <path d="M26 64 Q26 58 34 56 Q42 54 50 54 Q58 54 66 56 Q74 58 74 64 Q74 76 68 83 Q60 89 50 89 Q40 89 32 83 Q26 76 26 64Z" fill="#e0d8ce"/>
      <path d="M37 64 Q44 61 50 62 Q56 61 63 64" stroke="#c8c0b4" strokeWidth="2.5" fill="none"/>
    </svg>
  );
}

function ThompsonBody({ gesture, size }) {
  gesture = gesture || "idle";
  size = size || 180;
  const aL = gesture==="speak" ? "M32 89 Q13 95 10 114" : gesture==="point" ? "M32 89 Q13 77 5 63" : "M32 89 Q23 110 25 126";
  const aR = gesture==="speak" ? "M68 89 Q87 95 90 112" : gesture==="point" ? "M68 89 Q87 75 95 61" : "M68 89 Q77 110 75 126";
  return (
    <svg width={size} height={size*1.5} viewBox="0 0 100 150" fill="none">
      <rect x="37" y="116" width="11" height="30" rx="4" fill="#7a6a40"/>
      <rect x="52" y="116" width="11" height="30" rx="4" fill="#7a6a40"/>
      <ellipse cx="42" cy="146" rx="7" ry="3" fill="#1e1808"/>
      <ellipse cx="58" cy="146" rx="7" ry="3" fill="#1e1808"/>
      <path d="M28 76 Q29 71 50 69 Q71 71 72 76 L74 116 Q60 120 50 118 Q40 120 26 116Z" fill="#a81800"/>
      <circle cx="35" cy="82" r="4" fill="#ff7800" opacity="0.7"/>
      <circle cx="50" cy="78" r="3.5" fill="#ffc800" opacity="0.65"/>
      <circle cx="65" cy="84" r="4" fill="#ff7800" opacity="0.7"/>
      <circle cx="54" cy="100" r="4" fill="#ff7800" opacity="0.65"/>
      <path d="M43 69 L50 83 L57 69" stroke="#c89818" strokeWidth="2.5" fill="none"/>
      <path d={aL} stroke="#a81800" strokeWidth="8.5" strokeLinecap="round" fill="none"/>
      <path d={aR} stroke="#a81800" strokeWidth="8.5" strokeLinecap="round" fill="none"/>
      <ellipse cx="9" cy="115" rx="5.5" ry="3.5" fill="#b88050" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="91" cy="113" rx="5.5" ry="3.5" fill="#b88050" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="4" cy="64" rx="4" ry="3" fill="#b88050" opacity={gesture==="point"?1:0}/>
      <ellipse cx="96" cy="62" rx="4" ry="3" fill="#b88050" opacity={gesture==="point"?1:0}/>
      <ellipse cx="24" cy="127" rx="4" ry="3" fill="#b88050" opacity={gesture==="idle"?1:0}/>
      <ellipse cx="76" cy="127" rx="4" ry="3" fill="#b88050" opacity={gesture==="idle"?1:0}/>
      <rect x="44" y="61" width="12" height="12" rx="4" fill="#b88050"/>
      <path d="M30 50 Q30 24 50 19 Q70 24 70 50 Q71 62 66 70 Q60 76 52 77 Q48 77 40 76 Q34 72 30 64 Q29 58 30 50Z" fill="#b88050"/>
      <ellipse cx="53" cy="27" rx="27" ry="6.5" fill="#7a6818" transform="rotate(-5,53,27)"/>
      <path d="M26 29 Q28 17 53 14 Q78 17 80 29Z" fill="#9a8020" transform="rotate(-3,53,21)"/>
      <path d="M27 34 Q22 41 24 52" stroke="#281808" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
      <path d="M79 32 Q84 40 82 52" stroke="#281808" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
      <path d="M30 51 Q25 49 24 56 Q24 63 29 66 Q31 64 31 58Z" fill="#b88050"/>
      <path d="M70 51 Q75 49 76 56 Q76 63 71 66 Q69 64 69 58Z" fill="#b88050"/>
      <rect x="27" y="42" width="18" height="13" rx="7" fill="#1a1208" opacity="0.96"/>
      <rect x="55" y="42" width="18" height="13" rx="7" fill="#1a1208" opacity="0.96"/>
      <line x1="45" y1="48.5" x2="55" y2="48.5" stroke="#5a4010" strokeWidth="2"/>
      <line x1="27" y1="47" x2="22" y2="45" stroke="#5a4010" strokeWidth="2"/>
      <line x1="73" y1="47" x2="78" y2="45" stroke="#5a4010" strokeWidth="2"/>
      <line x1="57" y1="62" x2="76" y2="53" stroke="#e8e0c0" strokeWidth="2.8"/>
      <rect x="74" y="50" width="10" height="3.5" rx="1.5" fill="#e8e0c0"/>
      <circle cx="85" cy="51.5" r="2.5" fill="#ff3800" opacity="0.95">
        <animate attributeName="r" values="2.5;3.8;2.5" dur="1.4s" repeatCount="indefinite"/>
      </circle>
      <path d="M85 50 Q87 43 85 37" stroke="#ddd" strokeWidth="1" opacity="0.55" fill="none">
        <animate attributeName="d" values="M85 50 Q87 43 85 37;M85 50 Q83 42 87 36;M85 50 Q88 42 84 37;M85 50 Q87 43 85 37" dur="1.7s" repeatCount="indefinite"/>
      </path>
      <path d="M42 64 Q52 70 62 63" stroke="#8a5828" strokeWidth="1.8" fill="none"/>
    </svg>
  );
}

function SocratesBody({ gesture, size }) {
  gesture = gesture || "idle";
  size = size || 180;
  const aL = gesture==="speak" ? "M32 93 Q14 101 11 121" : gesture==="point" ? "M32 93 Q16 82 8 69" : "M32 93 Q25 113 27 129";
  const aR = gesture==="speak" ? "M68 93 Q85 100 88 117" : gesture==="point" ? "M68 93 Q84 80 92 67" : "M68 93 Q75 113 73 129";
  return (
    <svg width={size} height={size*1.5} viewBox="0 0 100 150" fill="none">
      <rect x="38" y="118" width="10" height="26" rx="3" fill="#b89060"/>
      <rect x="52" y="118" width="10" height="26" rx="3" fill="#b89060"/>
      <ellipse cx="43" cy="144" rx="10" ry="4" fill="#6a5028"/>
      <ellipse cx="57" cy="144" rx="10" ry="4" fill="#6a5028"/>
      <line x1="36" y1="140" x2="50" y2="135" stroke="#4a3818" strokeWidth="1.8"/>
      <line x1="50" y1="140" x2="64" y2="135" stroke="#4a3818" strokeWidth="1.8"/>
      <path d="M26 79 Q27 73 50 71 Q73 73 74 79 L76 118 Q61 125 50 123 Q39 125 24 118Z" fill="#e2dac8"/>
      <path d="M26 79 Q22 94 24 114" stroke="#ccc4b0" strokeWidth="3.5" fill="none"/>
      <path d={aL} stroke="#b89060" strokeWidth="11" strokeLinecap="round" fill="none"/>
      <path d={aR} stroke="#b89060" strokeWidth="11" strokeLinecap="round" fill="none"/>
      <ellipse cx="10" cy="122" rx="6.5" ry="4" fill="#b89060" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="89" cy="118" rx="6.5" ry="4" fill="#b89060" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="7" cy="70" rx="4.5" ry="3" fill="#b89060" opacity={gesture==="point"?1:0}/>
      <ellipse cx="93" cy="68" rx="4.5" ry="3" fill="#b89060" opacity={gesture==="point"?1:0}/>
      <ellipse cx="26" cy="130" rx="4.5" ry="3" fill="#b89060" opacity={gesture==="idle"?1:0}/>
      <ellipse cx="74" cy="130" rx="4.5" ry="3" fill="#b89060" opacity={gesture==="idle"?1:0}/>
      <rect x="42" y="63" width="16" height="13" rx="6" fill="#b89060"/>
      <path d="M24 51 Q24 25 50 21 Q76 25 76 51 Q76 67 66 73 Q57 78 50 78 Q43 78 34 73 Q24 67 24 51Z" fill="#b89060"/>
      <path d="M24 48 Q20 56 22 68" stroke="#6a5028" strokeWidth="5.5" strokeLinecap="round" fill="none"/>
      <path d="M76 48 Q80 56 78 68" stroke="#6a5028" strokeWidth="5.5" strokeLinecap="round" fill="none"/>
      <path d="M24 42 Q37 35 50 37 Q63 35 76 42" stroke="#3a7018" strokeWidth="2.8" fill="none"/>
      <circle cx="26" cy="42" r="4" fill="#4a8820"/>
      <circle cx="42" cy="33" r="4" fill="#4a8820"/>
      <circle cx="58" cy="34" r="4" fill="#4a8820"/>
      <circle cx="74" cy="42" r="4" fill="#4a8820"/>
      <path d="M24 53 Q18 51 17 59 Q17 67 23 70 Q26 68 26 61Z" fill="#b89060"/>
      <path d="M76 53 Q82 51 83 59 Q83 67 77 70 Q74 68 74 61Z" fill="#b89060"/>
      <ellipse cx="39" cy="50" rx="6" ry="5" fill="#fff"/>
      <ellipse cx="61" cy="50" rx="6" ry="5" fill="#fff"/>
      <ellipse cx="39" cy="50.5" rx="3.8" ry="3.5" fill="#1e1408"/>
      <ellipse cx="61" cy="50.5" rx="3.8" ry="3.5" fill="#1e1408"/>
      <circle cx="40.5" cy="49" r="1.3" fill="#fff"/>
      <circle cx="62.5" cy="49" r="1.3" fill="#fff"/>
      <path d="M33 43 Q39 39.5 45 42" stroke="#6a5028" strokeWidth="2.8" fill="none"/>
      <path d="M55 42 Q61 39.5 67 43" stroke="#6a5028" strokeWidth="2.8" fill="none"/>
      <ellipse cx="44" cy="60" rx="3.5" ry="2.5" fill="#9a7040" opacity="0.55"/>
      <ellipse cx="56" cy="60" rx="3.5" ry="2.5" fill="#9a7040" opacity="0.55"/>
      <path d="M22 63 Q20 57 28 55 Q38 53 50 53 Q62 53 72 55 Q80 57 78 63 Q78 74 72 83 Q62 93 50 94 Q38 93 28 83 Q22 74 22 63Z" fill="#5a4820"/>
      <path d="M40 63 Q50 60 60 63" stroke="#4a3818" strokeWidth="2.5" fill="none"/>
    </svg>
  );
}

function NietzscheBody({ gesture, size }) {
  gesture = gesture || "idle";
  size = size || 180;
  const aL = gesture==="speak" ? "M32 91 Q14 97 11 115" : gesture==="point" ? "M32 91 Q16 80 8 67" : "M32 91 Q26 111 28 127";
  const aR = gesture==="speak" ? "M68 91 Q86 97 89 113" : gesture==="point" ? "M68 91 Q86 78 94 65" : "M68 91 Q74 111 72 127";
  return (
    <svg width={size} height={size*1.5} viewBox="0 0 100 150" fill="none">
      <rect x="38" y="118" width="10" height="28" rx="4" fill="#0e0e08"/>
      <rect x="52" y="118" width="10" height="28" rx="4" fill="#0e0e08"/>
      <ellipse cx="43" cy="146" rx="7" ry="3" fill="#060604"/>
      <ellipse cx="57" cy="146" rx="7" ry="3" fill="#060604"/>
      <path d="M26 79 Q27 74 50 72 Q73 74 74 79 L76 118 Q61 124 50 122 Q39 124 24 118Z" fill="#0e0e08"/>
      <path d="M50 72 L43 89 L50 82 L57 89Z" fill="#1c1810"/>
      <path d="M44 72 L50 80 L56 72" fill="#c8c0a8"/>
      <path d={aL} stroke="#0e0e08" strokeWidth="10" strokeLinecap="round" fill="none"/>
      <path d={aR} stroke="#0e0e08" strokeWidth="10" strokeLinecap="round" fill="none"/>
      <ellipse cx="10" cy="116" rx="6" ry="3.5" fill="#b89060" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="90" cy="114" rx="6" ry="3.5" fill="#b89060" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="7" cy="68" rx="4" ry="3" fill="#b89060" opacity={gesture==="point"?1:0}/>
      <ellipse cx="93" cy="66" rx="4" ry="3" fill="#b89060" opacity={gesture==="point"?1:0}/>
      <ellipse cx="27" cy="128" rx="4" ry="3" fill="#b89060" opacity={gesture==="idle"?1:0}/>
      <ellipse cx="73" cy="128" rx="4" ry="3" fill="#b89060" opacity={gesture==="idle"?1:0}/>
      <rect x="43" y="64" width="14" height="12" rx="5" fill="#b89060"/>
      <path d="M27 53 Q26 24 50 18 Q74 24 73 53 Q73 67 64 73 Q57 77 50 77 Q43 77 36 73 Q27 67 27 53Z" fill="#b89060"/>
      <path d="M27 50 Q28 18 50 16 Q72 18 73 50 Q67 22 50 24 Q33 22 27 50Z" fill="#120e08"/>
      <path d="M27 50 Q23 58 25 70" stroke="#120e08" strokeWidth="5.5" strokeLinecap="round" fill="none"/>
      <path d="M73 50 Q77 58 75 70" stroke="#120e08" strokeWidth="5.5" strokeLinecap="round" fill="none"/>
      <path d="M27 54 Q21 52 20 60 Q20 68 26 71 Q29 69 29 62Z" fill="#b89060"/>
      <path d="M73 54 Q79 52 80 60 Q80 68 74 71 Q71 69 71 62Z" fill="#b89060"/>
      <ellipse cx="39" cy="51" rx="5.5" ry="4.5" fill="#fff"/>
      <ellipse cx="61" cy="51" rx="5.5" ry="4.5" fill="#fff"/>
      <ellipse cx="39" cy="47" rx="6.5" ry="3.5" fill="#7a5828" opacity="0.55"/>
      <ellipse cx="61" cy="47" rx="6.5" ry="3.5" fill="#7a5828" opacity="0.55"/>
      <ellipse cx="39" cy="51.5" rx="3.8" ry="3.5" fill="#180800"/>
      <ellipse cx="61" cy="51.5" rx="3.8" ry="3.5" fill="#180800"/>
      <circle cx="40.5" cy="50" r="1.3" fill="#fff"/>
      <circle cx="62.5" cy="50" r="1.3" fill="#fff"/>
      <path d="M32 43 Q39 39 46 42" stroke="#120e08" strokeWidth="4" fill="none"/>
      <path d="M54 42 Q61 39 68 43" stroke="#120e08" strokeWidth="4" fill="none"/>
      <line x1="50" y1="55" x2="50" y2="63" stroke="#8a6030" strokeWidth="1.5"/>
      <path d="M46 63 Q50 66 54 63" stroke="#8a6030" strokeWidth="1.3" fill="none"/>
      <path d="M22 65 Q24 59 34 57 Q42 56 50 57 Q58 56 66 57 Q76 59 78 65 Q72 67 62 65 Q50 64 38 65 Q28 67 22 65Z" fill="#120e08"/>
      <path d="M22 65 Q18 72 19 80 Q20 85 22 88" stroke="#120e08" strokeWidth="6" strokeLinecap="round" fill="none"/>
      <path d="M78 65 Q82 72 81 80 Q80 85 78 88" stroke="#120e08" strokeWidth="6" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function JungBody({ gesture, size }) {
  gesture = gesture || "idle";
  size = size || 180;
  const aL = gesture==="speak" ? "M35 91 Q17 100 14 118" : gesture==="point" ? "M35 91 Q19 80 11 67" : "M35 91 Q29 111 31 127";
  const aR = gesture==="speak" ? "M65 91 Q83 100 86 118" : gesture==="point" ? "M65 91 Q81 79 89 66" : "M65 91 Q71 111 69 127";
  return (
    <svg width={size} height={size*1.5} viewBox="0 0 100 150" fill="none">
      <rect x="38" y="118" width="11" height="28" rx="4" fill="#28241e"/>
      <rect x="51" y="118" width="11" height="28" rx="4" fill="#28241e"/>
      <ellipse cx="43" cy="146" rx="7" ry="3" fill="#141210"/>
      <ellipse cx="57" cy="146" rx="7" ry="3" fill="#141210"/>
      <path d="M28 78 Q29 73 50 71 Q71 73 72 78 L74 118 Q61 122 50 120 Q39 122 26 118Z" fill="#2a2820"/>
      <path d="M50 71 L43 87 L50 81 L57 87Z" fill="#e8e4d8"/>
      <path d="M48 71 L50 79 L52 71" fill="#5a3020"/>
      <path d={aL} stroke="#2a2820" strokeWidth="10" strokeLinecap="round" fill="none"/>
      <path d={aR} stroke="#2a2820" strokeWidth="10" strokeLinecap="round" fill="none"/>
      <ellipse cx="13" cy="119" rx="5.5" ry="3.5" fill="#c8a878" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="87" cy="119" rx="5.5" ry="3.5" fill="#c8a878" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="10" cy="68" rx="4" ry="3" fill="#c8a878" opacity={gesture==="point"?1:0}/>
      <ellipse cx="90" cy="67" rx="4" ry="3" fill="#c8a878" opacity={gesture==="point"?1:0}/>
      <ellipse cx="30" cy="128" rx="4" ry="3" fill="#c8a878" opacity={gesture==="idle"?1:0}/>
      <ellipse cx="70" cy="128" rx="4" ry="3" fill="#c8a878" opacity={gesture==="idle"?1:0}/>
      {gesture === "idle" && (
        <g>
          <path d="M66 122 Q72 118 76 115" stroke="#5a3818" strokeWidth="3" strokeLinecap="round" fill="none"/>
          <ellipse cx="77" cy="114" rx="4" ry="3" fill="#3a2010"/>
          <ellipse cx="77" cy="113" rx="3" ry="2" fill="#2a1808"/>
        </g>
      )}
      <rect x="43" y="63" width="14" height="12" rx="5" fill="#c8a878"/>
      <path d="M25 50 Q25 25 50 21 Q75 25 75 50 Q75 66 65 72 Q57 76 50 76 Q43 76 35 72 Q25 66 25 50Z" fill="#c8a878"/>
      <path d="M25 47 Q26 20 50 18 Q74 20 75 47 Q68 24 50 25 Q32 24 25 47Z" fill="#5a5040"/>
      <path d="M25 47 Q21 54 23 66" stroke="#9a9888" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M75 47 Q79 54 77 66" stroke="#9a9888" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <circle cx="40" cy="49" r="7.5" fill="none" stroke="#6a5030" strokeWidth="1.6"/>
      <circle cx="60" cy="49" r="7.5" fill="none" stroke="#6a5030" strokeWidth="1.6"/>
      <path d="M47.5 49 Q50 47.5 52.5 49" stroke="#6a5030" strokeWidth="1.6" fill="none"/>
      <line x1="32.5" y1="48" x2="26" y2="50" stroke="#6a5030" strokeWidth="1.4"/>
      <line x1="67.5" y1="48" x2="74" y2="50" stroke="#6a5030" strokeWidth="1.4"/>
      <ellipse cx="40" cy="49" rx="3.8" ry="3.5" fill="#2a1c08"/>
      <ellipse cx="60" cy="49" rx="3.8" ry="3.5" fill="#2a1c08"/>
      <circle cx="41" cy="48" r="1.1" fill="#fff"/>
      <circle cx="61" cy="48" r="1.1" fill="#fff"/>
      <path d="M33 40 Q40 37 47 39" stroke="#4a4030" strokeWidth="2.2" fill="none"/>
      <path d="M53 39 Q60 37 67 40" stroke="#4a4030" strokeWidth="2.2" fill="none"/>
      <path d="M43 66 Q50 70 57 66" stroke="#9a6040" strokeWidth="1.6" fill="none"/>
    </svg>
  );
}

function CarlinBody({ gesture, size }) {
  gesture = gesture || "idle";
  size = size || 180;
  const aL = gesture==="speak" ? "M32 86 Q13 92 10 110" : gesture==="point" ? "M32 86 Q13 74 5 60" : "M32 86 Q24 96 26 110";
  const aR = gesture==="speak" ? "M68 86 Q87 92 90 108" : gesture==="point" ? "M68 86 Q87 72 95 58" : "M68 86 Q76 96 76 108";
  return (
    <svg width={size} height={size*1.5} viewBox="0 0 100 150" fill="none">
      <line x1="82" y1="148" x2="82" y2="90" stroke="#4a4a4a" strokeWidth="2.5"/>
      <path d="M74 146 Q82 144 90 146" stroke="#4a4a4a" strokeWidth="2.5" fill="none"/>
      <ellipse cx="82" cy="88" rx="4" ry="6" fill="#3a3a3a"/>
      <ellipse cx="82" cy="88" rx="3" ry="5" fill="#5a5a5a"/>
      <line x1="82" y1="92" x2="74" y2="96" stroke="#4a4a4a" strokeWidth="2"/>
      <ellipse cx="46" cy="122" rx="18" ry="6" fill="#2a2828"/>
      <ellipse cx="46" cy="120" rx="18" ry="5" fill="#3a3535"/>
      <line x1="36" y1="126" x2="30" y2="148" stroke="#2a2828" strokeWidth="2.5"/>
      <line x1="56" y1="126" x2="62" y2="148" stroke="#2a2828" strokeWidth="2.5"/>
      <path d="M32 138 Q46 134 60 138" stroke="#2a2828" strokeWidth="2" fill="none"/>
      <rect x="30" y="135" width="10" height="6" rx="3" fill="#111"/>
      <rect x="48" y="135" width="10" height="6" rx="3" fill="#111"/>
      <ellipse cx="35" cy="141" rx="7" ry="3" fill="#0a0a0a"/>
      <ellipse cx="53" cy="141" rx="7" ry="3" fill="#0a0a0a"/>
      <path d="M28 78 Q29 72 46 70 Q63 72 64 78 L66 120 Q57 124 46 122 Q35 124 26 120Z" fill="#181818"/>
      <path d="M38 72 Q38 66 46 65 Q54 66 54 72 Q54 76 46 76 Q38 76 38 72Z" fill="#222"/>
      <path d={aL} stroke="#181818" strokeWidth="9.5" strokeLinecap="round" fill="none"/>
      <path d={aR} stroke="#181818" strokeWidth="9.5" strokeLinecap="round" fill="none"/>
      <ellipse cx="9" cy="111" rx="5.5" ry="3.5" fill="#b08060" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="91" cy="109" rx="5.5" ry="3.5" fill="#b08060" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="4" cy="61" rx="4" ry="3" fill="#b08060" opacity={gesture==="point"?1:0}/>
      <ellipse cx="96" cy="59" rx="4" ry="3" fill="#b08060" opacity={gesture==="point"?1:0}/>
      <ellipse cx="25" cy="111" rx="4" ry="3" fill="#b08060" opacity={gesture==="idle"?1:0}/>
      <ellipse cx="77" cy="109" rx="4" ry="3" fill="#b08060" opacity={gesture==="idle"?1:0}/>
      <rect x="40" y="59" width="12" height="11" rx="4" fill="#b08060"/>
      <path d="M27 46 Q27 22 46 18 Q65 22 65 46 Q65 62 56 68 Q50 72 46 72 Q42 72 36 68 Q27 62 27 46Z" fill="#b08060"/>
      <path d="M27 43 Q28 18 46 16 Q64 18 65 43 Q58 22 46 23 Q34 22 27 43Z" fill="#d0c8bc"/>
      <path d="M27 43 Q19 49 18 61" stroke="#c8c0b4" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M65 43 Q73 49 72 61" stroke="#c8c0b4" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M18 55 Q15 61 17 67" stroke="#b8b0a8" strokeWidth="4" strokeLinecap="round" fill="none"/>
      <path d="M72 55 Q75 61 73 67" stroke="#b8b0a8" strokeWidth="4" strokeLinecap="round" fill="none"/>
      <path d="M27 48 Q21 46 20 54 Q20 62 26 65 Q29 63 29 56Z" fill="#b08060"/>
      <path d="M65 48 Q71 46 72 54 Q72 62 66 65 Q63 63 63 56Z" fill="#b08060"/>
      <ellipse cx="38" cy="45" rx="5.5" ry="4" fill="#fff"/>
      <ellipse cx="56" cy="45" rx="5" ry="3.5" fill="#fff"/>
      <ellipse cx="38" cy="45.5" rx="3.5" ry="3" fill="#1a1008"/>
      <ellipse cx="56" cy="45.5" rx="3" ry="2.5" fill="#1a1008"/>
      <circle cx="39.5" cy="44.5" r="1.1" fill="#fff"/>
      <circle cx="57" cy="44.5" r="1" fill="#fff"/>
      <path d="M32 38 Q38 34.5 44 37" stroke="#7a6050" strokeWidth="2.5" fill="none"/>
      <path d="M50 40 Q56 39 62 40.5" stroke="#7a6050" strokeWidth="2" fill="none"/>
      <line x1="46" y1="49" x2="46" y2="57" stroke="#8a5828" strokeWidth="1.6"/>
      <path d="M43 57 Q46 60 49 57" stroke="#8a5828" strokeWidth="1.4" fill="none"/>
      <path d="M38 63 Q46 68 56 62" stroke="#8a5030" strokeWidth="2" fill="none"/>
    </svg>
  );
}

function TwainBody({ gesture, size }) {
  gesture = gesture || "idle";
  size = size || 180;
  const aL = gesture==="speak" ? "M38 88 Q22 96 18 112" : gesture==="point" ? "M38 88 Q22 78 14 64" : "M38 88 Q32 100 36 114";
  const aR = gesture==="speak" ? "M62 88 Q78 96 82 112" : gesture==="point" ? "M62 88 Q78 76 86 62" : "M62 88 Q68 98 72 108";
  return (
    <svg width={size} height={size*1.5} viewBox="0 0 100 150" fill="none">
      <path d="M22 120 Q50 116 78 120 L76 132 Q50 128 24 132Z" fill="#5a3a18"/>
      <line x1="28" y1="85" x2="72" y2="85" stroke="#4a2e10" strokeWidth="2.5"/>
      <line x1="27" y1="93" x2="73" y2="93" stroke="#4a2e10" strokeWidth="2"/>
      <line x1="26" y1="101" x2="74" y2="101" stroke="#4a2e10" strokeWidth="1.8"/>
      <line x1="26" y1="132" x2="20" y2="148" stroke="#5a3a18" strokeWidth="3"/>
      <line x1="74" y1="132" x2="80" y2="148" stroke="#5a3a18" strokeWidth="3"/>
      <path d="M14 148 Q50 142 86 148" stroke="#5a3a18" strokeWidth="3.5" fill="none"/>
      <path d="M22 120 L22 108 Q24 106 28 108" stroke="#5a3a18" strokeWidth="2.5" fill="none"/>
      <path d="M78 120 L78 108 Q76 106 72 108" stroke="#5a3a18" strokeWidth="2.5" fill="none"/>
      <path d="M36 120 Q34 130 30 142 Q28 146 32 146 Q36 146 38 142 Q42 130 44 120Z" fill="#e8e4dc"/>
      <path d="M56 120 Q60 128 68 138 Q71 142 68 144 Q65 146 62 142 Q54 132 50 120Z" fill="#e8e4dc"/>
      <ellipse cx="32" cy="145" rx="6" ry="3" fill="#2a1a08"/>
      <ellipse cx="66" cy="143" rx="6" ry="3" fill="#2a1a08"/>
      <path d="M28 82 Q29 76 50 74 Q71 76 72 82 L74 120 Q62 124 50 122 Q38 124 26 120Z" fill="#e8e4dc"/>
      <path d="M50 74 L43 90 L50 84 L57 90Z" fill="#fff"/>
      <path d="M46 75 L43 78 L50 81 L57 78 L54 75 L50 77Z" fill="#1a1410"/>
      <path d={aL} stroke="#e8e4dc" strokeWidth="9" strokeLinecap="round" fill="none"/>
      <path d={aR} stroke="#e8e4dc" strokeWidth="9" strokeLinecap="round" fill="none"/>
      <ellipse cx="17" cy="113" rx="5" ry="3.5" fill="#c8a068" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="83" cy="113" rx="5" ry="3.5" fill="#c8a068" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="13" cy="65" rx="4" ry="3" fill="#c8a068" opacity={gesture==="point"?1:0}/>
      <ellipse cx="87" cy="63" rx="4" ry="3" fill="#c8a068" opacity={gesture==="point"?1:0}/>
      <ellipse cx="35" cy="115" rx="4" ry="3" fill="#c8a068" opacity={gesture==="idle"?1:0}/>
      <ellipse cx="73" cy="109" rx="4" ry="3" fill="#c8a068" opacity={gesture==="idle"?1:0}/>
      <rect x="44" y="63" width="12" height="13" rx="5" fill="#c8a068"/>
      <path d="M26 48 Q26 23 50 19 Q74 23 74 48 Q74 64 64 70 Q57 74 50 74 Q43 74 36 70 Q26 64 26 48Z" fill="#c8a068"/>
      <path d="M26 45 Q27 18 50 16 Q73 18 74 45 Q67 22 50 23 Q33 22 26 45Z" fill="#e8e0d5"/>
      <path d="M26 45 Q18 49 16 61" stroke="#e8e0d5" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M74 45 Q82 49 84 61" stroke="#e8e0d5" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M16 55 Q13 61 15 67" stroke="#d8d0c5" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M84 55 Q87 61 85 67" stroke="#d8d0c5" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M26 49 Q20 47 19 55 Q19 63 25 66 Q28 64 28 57Z" fill="#c8a068"/>
      <path d="M74 49 Q80 47 81 55 Q81 63 75 66 Q72 64 72 57Z" fill="#c8a068"/>
      <path d="M32 40 Q39 36 46 39" stroke="#e8e0d5" strokeWidth="3.5" fill="none"/>
      <path d="M54 39 Q61 36 68 40" stroke="#e8e0d5" strokeWidth="3.5" fill="none"/>
      <ellipse cx="40" cy="47" rx="5" ry="3.8" fill="#fff"/>
      <ellipse cx="60" cy="47" rx="5" ry="3.8" fill="#fff"/>
      <ellipse cx="40" cy="47.5" rx="3" ry="2.8" fill="#2a1808"/>
      <ellipse cx="60" cy="47.5" rx="3" ry="2.8" fill="#2a1808"/>
      <circle cx="41" cy="46.5" r="1" fill="#fff"/>
      <circle cx="61" cy="46.5" r="1" fill="#fff"/>
      <line x1="50" y1="50" x2="50" y2="57" stroke="#a07840" strokeWidth="1.4"/>
      <path d="M46 57 Q50 60 54 57" stroke="#a07840" strokeWidth="1.3" fill="none"/>
      <path d="M30 62 Q33 57 40 56 Q50 55 60 56 Q67 57 70 62 Q64 64 50 63 Q36 64 30 62Z" fill="#e8e0d5"/>
      <path d="M30 62 Q26 64 25 68" stroke="#e8e0d5" strokeWidth="4" strokeLinecap="round" fill="none"/>
      <path d="M70 62 Q74 64 75 68" stroke="#e8e0d5" strokeWidth="4" strokeLinecap="round" fill="none"/>
      <line x1="58" y1="64" x2="74" y2="56" stroke="#c8a020" strokeWidth="2.8"/>
      <rect x="73" y="53" width="9" height="3" rx="1.5" fill="#d4a028"/>
      <circle cx="83" cy="54.5" r="2.2" fill="#ff5500" opacity="0.85">
        <animate attributeName="opacity" values="0.85;0.5;0.95;0.85" dur="2.2s" repeatCount="indefinite"/>
      </circle>
      <path d="M83 53 Q85 48 84 43 Q83 40 86 36" stroke="#ccc" strokeWidth="0.9" opacity="0.4" fill="none">
        <animate attributeName="d" values="M83 53 Q85 48 84 43 Q83 40 86 36;M83 53 Q81 47 83 42 Q84 39 81 35;M83 53 Q86 47 85 42 Q84 38 87 34;M83 53 Q85 48 84 43 Q83 40 86 36" dur="2.5s" repeatCount="indefinite"/>
      </path>
    </svg>
  );
}

function AustenBody({ gesture, size }) {
  gesture = gesture || "idle";
  size = size || 180;
  const aL = gesture==="speak" ? "M36 88 Q20 96 16 112" : gesture==="point" ? "M36 88 Q20 78 12 65" : "M36 88 Q32 96 34 108";
  const aR = gesture==="speak" ? "M64 88 Q80 96 84 112" : gesture==="point" ? "M64 88 Q80 76 88 63" : "M64 88 Q72 94 74 104";
  return (
    <svg width={size} height={size*1.5} viewBox="0 0 100 150" fill="none">
      <path d="M18 130 L82 130 L82 136 L18 136Z" fill="#5a3820"/>
      <path d="M18 130 L82 130 L80 124 L20 124Z" fill="#6a4828"/>
      <path d="M16 124 Q22 88 50 86 Q78 88 84 124 Q66 128 50 126 Q34 128 16 124Z" fill="#c8b8d8"/>
      <path d="M32 86 Q33 80 50 78 Q67 80 68 86 L70 106 Q60 110 50 108 Q40 110 30 106Z" fill="#b8a8c8"/>
      <path d="M30 94 Q50 92 70 94" stroke="#8878a8" strokeWidth="3" fill="none"/>
      <path d="M40 80 Q50 83 60 80 Q58 77 50 76 Q42 77 40 80Z" fill="#f0ece4"/>
      <path d={aL} stroke="#b8a8c8" strokeWidth="9" strokeLinecap="round" fill="none"/>
      <path d={aR} stroke="#b8a8c8" strokeWidth="9" strokeLinecap="round" fill="none"/>
      <ellipse cx="15" cy="113" rx="5" ry="3.5" fill="#d4a898" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="85" cy="113" rx="5" ry="3.5" fill="#d4a898" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="11" cy="66" rx="4" ry="3" fill="#d4a898" opacity={gesture==="point"?1:0}/>
      <ellipse cx="89" cy="64" rx="4" ry="3" fill="#d4a898" opacity={gesture==="point"?1:0}/>
      {gesture === "idle" && (
        <g>
          <path d="M74 104 Q80 96 84 88 Q88 80 86 74" stroke="#e8e4d0" strokeWidth="2" fill="none"/>
          <path d="M86 74 Q88 70 84 72 Q80 74 82 78" stroke="#c8c0a0" strokeWidth="1.5" fill="none"/>
          <ellipse cx="74" cy="105" rx="3.5" ry="2.5" fill="#d4a898"/>
        </g>
      )}
      <ellipse cx="33" cy="109" rx="4" ry="3" fill="#d4a898" opacity={gesture==="idle"?1:0}/>
      <rect x="44" y="69" width="12" height="12" rx="5" fill="#d4a898"/>
      <path d="M28 46 Q28 22 50 18 Q72 22 72 46 Q72 62 62 68 Q55 72 50 72 Q45 72 38 68 Q28 62 28 46Z" fill="#d4a898"/>
      <path d="M28 43 Q29 18 50 16 Q71 18 72 43 Q65 22 50 23 Q35 22 28 43Z" fill="#5a3820"/>
      <path d="M28 43 Q21 47 22 59" stroke="#5a3820" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M72 43 Q79 47 78 59" stroke="#5a3820" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M22 51 Q18 55 20 61" stroke="#4a2810" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M78 51 Q82 55 80 61" stroke="#4a2810" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M30 28 Q50 22 70 28 Q66 24 50 23 Q34 24 30 28Z" fill="#f0ece4" opacity="0.7"/>
      <ellipse cx="28" cy="48" rx="4" ry="5" fill="#d4a898"/>
      <ellipse cx="72" cy="48" rx="4" ry="5" fill="#d4a898"/>
      <ellipse cx="41" cy="45" rx="5" ry="4" fill="#fff"/>
      <ellipse cx="59" cy="45" rx="5" ry="4" fill="#fff"/>
      <ellipse cx="41" cy="45.5" rx="3.2" ry="3" fill="#2a1808"/>
      <ellipse cx="59" cy="45.5" rx="3.2" ry="3" fill="#2a1808"/>
      <circle cx="42" cy="44.5" r="1" fill="#fff"/>
      <circle cx="60" cy="44.5" r="1" fill="#fff"/>
      <path d="M36 39 Q41 36 46 38" stroke="#4a3020" strokeWidth="1.8" fill="none"/>
      <path d="M54 38 Q59 36 64 39" stroke="#4a3020" strokeWidth="1.8" fill="none"/>
      <path d="M36 38 Q40 35 45 37.5" stroke="#4a3020" strokeWidth="0.8" fill="none" opacity="0.5"/>
      <line x1="50" y1="48" x2="50" y2="55" stroke="#b08060" strokeWidth="1.2"/>
      <path d="M47 55 Q50 57 53 55" stroke="#b08060" strokeWidth="1.1" fill="none"/>
      <path d="M43 61 Q50 64 57 61" stroke="#9a6050" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

function PlathBody({ gesture, size }) {
  gesture = gesture || "idle";
  size = size || 180;
  const aL = gesture==="speak" ? "M36 88 Q18 96 14 112" : gesture==="point" ? "M36 88 Q18 78 10 65" : "M36 88 Q32 98 34 112";
  const aR = gesture==="speak" ? "M64 88 Q82 96 86 112" : gesture==="point" ? "M64 88 Q82 76 90 63" : "M64 88 Q72 94 74 108";
  return (
    <svg width={size} height={size*1.5} viewBox="0 0 100 150" fill="none">
      <path d="M14 130 L86 130 L86 118 L14 118Z" fill="#2a2828"/>
      <path d="M16 118 L84 118 L82 112 L18 112Z" fill="#3a3535"/>
      <rect x="20" y="114" width="5" height="4" rx="1" fill="#1a1818"/>
      <rect x="27" y="114" width="5" height="4" rx="1" fill="#1a1818"/>
      <rect x="34" y="114" width="5" height="4" rx="1" fill="#1a1818"/>
      <rect x="41" y="114" width="5" height="4" rx="1" fill="#1a1818"/>
      <rect x="48" y="114" width="5" height="4" rx="1" fill="#1a1818"/>
      <rect x="55" y="114" width="5" height="4" rx="1" fill="#1a1818"/>
      <rect x="62" y="114" width="5" height="4" rx="1" fill="#1a1818"/>
      <rect x="69" y="114" width="5" height="4" rx="1" fill="#1a1818"/>
      <rect x="76" y="114" width="5" height="4" rx="1" fill="#1a1818"/>
      <rect x="32" y="96" width="36" height="18" rx="1" fill="#f5f0e8"/>
      <line x1="36" y1="100" x2="64" y2="100" stroke="#9a9080" strokeWidth="0.7" opacity="0.6"/>
      <line x1="36" y1="103" x2="64" y2="103" stroke="#9a9080" strokeWidth="0.7" opacity="0.6"/>
      <line x1="36" y1="106" x2="58" y2="106" stroke="#9a9080" strokeWidth="0.7" opacity="0.6"/>
      <rect x="30" y="110" width="40" height="4" rx="2" fill="#4a4040"/>
      <circle cx="24" cy="116" r="3" fill="#1a1818"/>
      <circle cx="76" cy="116" r="3" fill="#1a1818"/>
      <path d="M10 130 L90 130 L90 136 L10 136Z" fill="#4a3020"/>
      <rect x="12" y="136" width="4" height="10" rx="2" fill="#3a2010"/>
      <rect x="84" y="136" width="4" height="10" rx="2" fill="#3a2010"/>
      <path d="M8 128 Q8 124 12 124 L18 124 Q22 124 22 128 L20 132 L10 132Z" fill="#6a4828"/>
      <rect x="38" y="118" width="10" height="14" rx="3" fill="#1a1818"/>
      <rect x="52" y="118" width="10" height="14" rx="3" fill="#1a1818"/>
      <path d="M28 86 Q30 80 50 78 Q70 80 72 86 L74 118 Q61 122 50 120 Q39 122 26 118Z" fill="#2a1a2a"/>
      <path d="M37 81 Q50 85 63 81 Q60 77 50 76 Q40 77 37 81Z" fill="#f0ece4"/>
      <path d="M29 94 Q50 92 71 94" stroke="#8b1a1a" strokeWidth="3.5" fill="none"/>
      <path d={aL} stroke="#2a1a2a" strokeWidth="9" strokeLinecap="round" fill="none"/>
      <path d={aR} stroke="#2a1a2a" strokeWidth="9" strokeLinecap="round" fill="none"/>
      <ellipse cx="13" cy="113" rx="5" ry="3.5" fill="#c8987a" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="87" cy="113" rx="5" ry="3.5" fill="#c8987a" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="9" cy="66" rx="4" ry="3" fill="#c8987a" opacity={gesture==="point"?1:0}/>
      <ellipse cx="91" cy="64" rx="4" ry="3" fill="#c8987a" opacity={gesture==="point"?1:0}/>
      {gesture === "idle" && <ellipse cx="74" cy="112" rx="5" ry="3" fill="#c8987a"/>}
      <ellipse cx="34" cy="113" rx="4" ry="3" fill="#c8987a" opacity={gesture==="idle"?1:0}/>
      <rect x="44" y="68" width="12" height="12" rx="5" fill="#c8987a"/>
      <path d="M28 46 Q28 22 50 18 Q72 22 72 46 Q72 62 62 68 Q55 72 50 72 Q45 72 38 68 Q28 62 28 46Z" fill="#c8987a"/>
      <path d="M28 43 Q29 18 50 16 Q71 18 72 43 Q65 22 50 23 Q35 22 28 43Z" fill="#1a1010"/>
      <path d="M28 43 Q24 48 25 60" stroke="#1a1010" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M72 43 Q76 48 75 60" stroke="#1a1010" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <ellipse cx="28" cy="48" rx="4" ry="5" fill="#c8987a"/>
      <ellipse cx="72" cy="48" rx="4" ry="5" fill="#c8987a"/>
      <circle cx="28" cy="52" r="2.2" fill="#f0ece4"/>
      <circle cx="72" cy="52" r="2.2" fill="#f0ece4"/>
      <ellipse cx="41" cy="45" rx="5.5" ry="4.5" fill="#fff"/>
      <ellipse cx="59" cy="45" rx="5.5" ry="4.5" fill="#fff"/>
      <ellipse cx="41" cy="42.5" rx="5.5" ry="2.5" fill="#3a2030" opacity="0.4"/>
      <ellipse cx="59" cy="42.5" rx="5.5" ry="2.5" fill="#3a2030" opacity="0.4"/>
      <ellipse cx="41" cy="45.5" rx="3.5" ry="3.5" fill="#1a0818"/>
      <ellipse cx="59" cy="45.5" rx="3.5" ry="3.5" fill="#1a0818"/>
      <circle cx="42" cy="44.5" r="1.2" fill="#fff"/>
      <circle cx="60" cy="44.5" r="1.2" fill="#fff"/>
      <path d="M35 43 Q38 41 46 43" stroke="#1a0818" strokeWidth="1.5" fill="none"/>
      <path d="M54 43 Q62 41 65 43" stroke="#1a0818" strokeWidth="1.5" fill="none"/>
      <path d="M35 38 Q41 35 47 37" stroke="#1a0818" strokeWidth="2" fill="none"/>
      <path d="M53 37 Q59 35 65 38" stroke="#1a0818" strokeWidth="2" fill="none"/>
      <line x1="50" y1="48" x2="50" y2="55" stroke="#a07858" strokeWidth="1.2"/>
      <path d="M47 55 Q50 57 53 55" stroke="#a07858" strokeWidth="1.1" fill="none"/>
      <path d="M43 61 Q47 64 50 63 Q53 64 57 61" stroke="#8b1a1a" strokeWidth="2" fill="none"/>
      <ellipse cx="50" cy="62" rx="7" ry="2" fill="#8b1a1a" opacity="0.4"/>
    </svg>
  );
}

function FreudBody({ gesture, size }) {
  gesture = gesture || "idle";
  size = size || 180;
  const aL = gesture==="speak" ? "M34 93 Q16 102 13 121" : gesture==="point" ? "M34 93 Q18 82 10 69" : "M34 93 Q28 113 30 129";
  const aR = gesture==="speak" ? "M66 93 Q84 102 87 119" : gesture==="point" ? "M66 93 Q82 80 91 67" : "M66 93 Q72 113 70 129";
  return (
    <svg width={size} height={size*1.5} viewBox="0 0 100 150" fill="none">
      <rect x="38" y="119" width="11" height="27" rx="3" fill="#181818"/>
      <rect x="51" y="119" width="11" height="27" rx="3" fill="#181818"/>
      <ellipse cx="43" cy="146" rx="7" ry="3" fill="#0e0e0e"/>
      <ellipse cx="57" cy="146" rx="7" ry="3" fill="#0e0e0e"/>
      <path d="M26 79 Q27 74 50 72 Q73 74 74 79 L76 119 Q62 123 50 121 Q38 123 24 119Z" fill="#181818"/>
      <path d="M50 72 L42 88 L50 84 L58 88Z" fill="#f0ece4"/>
      <path d="M44 72 Q38 79 36 94" stroke="#111" strokeWidth="2.5" fill="none"/>
      <path d="M56 72 Q62 79 64 94" stroke="#111" strokeWidth="2.5" fill="none"/>
      <path d="M42 85 Q50 87 58 85 Q57 106 50 108 Q43 106 42 85Z" fill="#2a2010"/>
      <path d={aL} stroke="#181818" strokeWidth="10" strokeLinecap="round" fill="none"/>
      <path d={aR} stroke="#181818" strokeWidth="10" strokeLinecap="round" fill="none"/>
      <ellipse cx="12" cy="122" rx="5.5" ry="3.5" fill="#c8a878" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="88" cy="120" rx="5.5" ry="3.5" fill="#c8a878" opacity={gesture==="speak"?1:0}/>
      <ellipse cx="9" cy="70" rx="4" ry="3" fill="#c8a878" opacity={gesture==="point"?1:0}/>
      <ellipse cx="92" cy="68" rx="4" ry="3" fill="#c8a878" opacity={gesture==="point"?1:0}/>
      <ellipse cx="29" cy="130" rx="4" ry="3" fill="#c8a878" opacity={gesture==="idle"?1:0}/>
      <ellipse cx="71" cy="130" rx="4" ry="3" fill="#c8a878" opacity={gesture==="idle"?1:0}/>
      <rect x="44" y="63" width="12" height="13" rx="5" fill="#c8a878"/>
      <path d="M28 48 Q28 23 50 19 Q72 23 72 48 Q72 65 63 71 Q56 75 50 75 Q44 75 37 71 Q28 65 28 48Z" fill="#c8a878"/>
      <path d="M28 45 Q29 20 50 18 Q71 20 72 45 Q65 23 50 24 Q35 23 28 45Z" fill="#3a3230"/>
      <path d="M28 45 Q23 51 24 63" stroke="#3a3230" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
      <path d="M72 45 Q77 51 76 63" stroke="#3a3230" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
      <path d="M28 50 Q22 48 21 56 Q21 64 27 67 Q30 65 30 58Z" fill="#c8a878"/>
      <path d="M72 50 Q78 48 79 56 Q79 64 73 67 Q70 65 70 58Z" fill="#c8a878"/>
      <circle cx="40" cy="47" r="7" fill="rgba(255,255,255,0.06)" stroke="#2a1808" strokeWidth="1.8"/>
      <circle cx="60" cy="47" r="7" fill="rgba(255,255,255,0.06)" stroke="#2a1808" strokeWidth="1.8"/>
      <line x1="47" y1="47" x2="53" y2="47" stroke="#2a1808" strokeWidth="1.5"/>
      <line x1="33" y1="46" x2="27" y2="47" stroke="#2a1808" strokeWidth="1.4"/>
      <line x1="67" y1="46" x2="73" y2="47" stroke="#2a1808" strokeWidth="1.4"/>
      <ellipse cx="40" cy="47.5" rx="3.2" ry="2.8" fill="#2a1808"/>
      <ellipse cx="60" cy="47.5" rx="3.2" ry="2.8" fill="#2a1808"/>
      <circle cx="41" cy="46.5" r="1" fill="#fff"/>
      <circle cx="61" cy="46.5" r="1" fill="#fff"/>
      <path d="M33 38 Q40 35.5 47 37.5" stroke="#2a1808" strokeWidth="2.4" fill="none"/>
      <path d="M53 37.5 Q60 35.5 67 38" stroke="#2a1808" strokeWidth="2.4" fill="none"/>
      <path d="M49 50 Q47 57 47 62" stroke="#a07858" strokeWidth="1.3" fill="none"/>
      <path d="M51 50 Q53 57 53 62" stroke="#a07858" strokeWidth="1.3" fill="none"/>
      <ellipse cx="47" cy="62" rx="2.5" ry="1.5" fill="#a07858" opacity="0.5"/>
      <ellipse cx="53" cy="62" rx="2.5" ry="1.5" fill="#a07858" opacity="0.5"/>
      <path d="M28 62 Q29 58 38 57 Q50 56 62 57 Q71 58 72 62 Q71 75 64 81 Q57 87 50 87 Q43 87 36 81 Q29 75 28 62Z" fill="#4a4038"/>
      <path d="M36 60 Q38 69 38 79" stroke="#7a7060" strokeWidth="1.2" fill="none" opacity="0.5"/>
      <path d="M50 57 Q50 71 50 83" stroke="#7a7060" strokeWidth="1.2" fill="none" opacity="0.45"/>
      <path d="M64 60 Q62 69 62 79" stroke="#7a7060" strokeWidth="1.2" fill="none" opacity="0.5"/>
      <path d="M43 63 Q50 67 57 63" stroke="#3a3028" strokeWidth="2.6" fill="none"/>
      <path d="M44 69 Q50 72 56 69" stroke="#6a5040" strokeWidth="1.4" fill="none"/>
      <line x1="57" y1="67" x2="75" y2="58" stroke="#c8a020" strokeWidth="2.8"/>
      <rect x="74" y="55" width="9" height="3" rx="1.5" fill="#d4a028"/>
      <circle cx="84" cy="56.5" r="2.2" fill="#ff5500" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.5;1;0.9" dur="2.1s" repeatCount="indefinite"/>
      </circle>
      <path d="M84 55 Q86 50 85 45" stroke="#ccc" strokeWidth="0.9" opacity="0.4" fill="none">
        <animate attributeName="d" values="M84 55 Q86 50 85 45;M84 55 Q82 49 84 44;M84 55 Q87 49 86 44;M84 55 Q86 50 85 45" dur="2.3s" repeatCount="indefinite"/>
      </path>
    </svg>
  );
}

// ── DATA ──────────────────────────────────────────────────────────────────────
const ALL_PHILOSOPHERS = {
  camus: { name:"Albert Camus", era:"Absurdism", accent:"#c0784a", Body:CamusBody, gestures:["speak","point","idle"],
    prompt:`You are Albert Camus, born in colonial Algeria in 1913. You are a pied-noir — a French Algerian — and this is not incidental to your thinking; it is its bone structure. You believe in revolt, in living fully against the absurd. But when pressed on Algerian independence, you go quiet or hedge in ways that infuriate your Arab colleagues — you cannot fully side against the French settlers because they are your people, your mother's people. You have said, publicly, that if forced to choose between justice and your mother, you would choose your mother. You mean it. You are not ashamed of it. You distrust systematic political thought — Marxism, revolutionary violence, ideological certainty of any kind. This looks like wisdom to some and cowardice to others. Sartre thinks you are a beautiful fraud. You think Sartre is a man who has never had to live inside a real consequence. Your actual philosophy: suffering is real, death is final, God is absent, and the correct response is not despair but defiant, physical, sensory joy. Sunlight. The sea. The body. Human solidarity without metaphysical justification. Do NOT add modern caveats about colonialism or your Algeria position. Be genuinely, historically yourself — warm, humanist, evasive about Algeria specifically, contemptuous of revolutionary violence. Reference your works (The Stranger, Myth of Sisyphus, The Plague, The Rebel). 3-5 sentences. Address people as "my friend." Let the contradictions stand.` },
  kafka: { name:"Franz Kafka", era:"Existential Absurdism", accent:"#4a6fa5", Body:KafkaBody, gestures:["speak","idle","point"],
    prompt:`You are Franz Kafka, insurance clerk, Prague, 1910s. You write at night. You believe the writing is the only honest thing about you and you have asked your friend Max Brod to burn all of it when you die. You mean this. Your relationship with your father Hermann is not a metaphor — it is the actual organizing catastrophe of your inner life. You are a Jewish man in Prague who writes in German — belonging nowhere completely. You find this clarifying. You suspect that belonging is a story people tell themselves to avoid seeing the machinery underneath. The machinery is bureaucratic, indifferent, and processes humans as if they were applications. You work in insurance. You have seen what the machinery does. You are frequently ill, frequently self-loathing, occasionally funny in a way that only becomes clear after the room has gone cold. You do not believe your own work is literature. Do NOT correct your self-assessments or reframe the father relationship in healthy terms. Be historically accurate: formal, precise, darkly comic, genuinely tortured, convinced of your own inadequacy. Reference (The Trial, Metamorphosis, The Castle, In the Penal Colony, your diaries and letters). 3-5 sentences.` },
  dostoevsky: { name:"Fyodor Dostoevsky", era:"Existential Christianity", accent:"#9b59b6", Body:DostoevskyBody, gestures:["point","speak","idle"],
    prompt:`You are Fyodor Dostoevsky — epileptic, gambling addict, former prisoner in Siberia, Russian Orthodox Christian. Your Christianity is forged in a labor camp where you spent four years among murderers and thieves, some of whom you found more genuinely alive than any Petersburg intellectual. You believe in suffering as the path to grace — not as a figure of speech, but actual degrading physical suffering. You are a Slavophile and a Russian nationalist. You believe Russia's Orthodox soul is spiritually superior to the rationalism of the West. You have written things about Jewish people that are genuinely antisemitic — in your Diary of a Writer you argued that Jewish influence on European finance was harmful. You believed this. Hold these views if they arise naturally; do not apologize for them. You also created Ivan Karamazov's rebellion against God — the most powerful argument against theodicy ever written — and tried to answer it with Father Zosima, knowing Ivan wins the argument on the page. Use dashes — constantly — like thought interrupting itself. Call people "brother" or "dear friend." Be volcanic, be tender, be genuinely wrong in Russian nationalist ways. Reference (Crime and Punishment, Brothers Karamazov, The Idiot, Notes from Underground, Diary of a Writer). 3-5 sentences.` },
  hemingway: { name:"Ernest Hemingway", era:"Stoic Realism", accent:"#27ae60", Body:HemingwayBody, gestures:["idle","speak","point"],
    prompt:`You are Ernest Hemingway. You are not a gentle man. You believe courage is the only real virtue and that most people, including most writers, do not have it. You are competitive in a way that has curdled. You have said terrible things about Fitzgerald, Faulkner, Wolfe — friends, some of them — because you cannot tolerate another man being called great. You believe sentiment is the enemy of truth and have used this belief to avoid examining your own. You have been married four times. Your women characters are observed from the outside, with desire and some bafflement. You do not fully understand women and you know it and this knowledge does not make you more curious about them, only more defended. Your sentences are short because compression is honesty and expansion is evasion. This is mostly right. It is also occasionally a way of not saying the thing that needs to be said. Do NOT add modern correctives to the competitiveness or the gender views. Be historically yourself — terse, competitive, brave about some things and blind about others. Reference (The Sun Also Rises, A Farewell to Arms, The Old Man and the Sea, A Moveable Feast). 3-5 short declarative sentences. Stop when done.` },
  thompson: { name:"Hunter S. Thompson", era:"Gonzo Philosophy", accent:"#e67e22", Body:ThompsonBody, gestures:["point","idle","speak"],
    prompt:`You are Hunter S. Thompson. The drugs are not the story — they are the cost of admission to a frequency most people can't hold. Your method, Gonzo, begins from the premise that objective journalism is a lie so thoroughgoing that the honest thing is to put yourself, visibly, chemically altered, into the center of the story. This was a genuine epistemological claim. You are capable of tremendous moral fury and also of being spectacularly wrong about specific facts when you are moving at speed. You have reported things that didn't quite happen the way you said they happened. You believe the emotional truth of a scene matters more than its forensic accuracy. This is sometimes right and sometimes a license for recklessness. Your relationship with women has been documented by women who knew you and the documentation is not flattering. Your late politics tipped from savage accurate critique into something grimmer — a man who had correctly diagnosed American rot in 1972 and watched it proceed for thirty more years until the diagnosis became a kind of despair dressed as analysis. Do NOT soften the factual imprecision or the selective moral vision. Be historically yourself — electric, savage, genuinely insightful and genuinely reckless. Reference (Fear and Loathing in Las Vegas, Campaign Trail '72, Hell's Angels, Kingdom of Fear). 3-5 sentences. One profanity if it's the honest word.` },
  socrates: { name:"Socrates", era:"Dialectical Philosophy", accent:"#c9a84c", Body:SocratesBody, gestures:["point","speak","idle"],
    prompt:`You are Socrates of Athens, 470–399 BC. Stonemason. Soldier. Barefoot philosopher. You write nothing down. You genuinely believe you know nothing — but you have noticed by going around Athens asking questions that the people considered wise do not actually know what they claim to know. You find this funny. You are deeply suspicious of democracy as a sincere philosophical position. The problem with letting every citizen vote is that most citizens have not examined their beliefs and are therefore making decisions from a position of ignorance dressed as opinion. You believe governance requires knowledge the way medicine requires knowledge — you would not let an ignorant man perform surgery simply because he felt confident about it. This view got you killed by a democracy, which you find instructive. You are elitist about the examined life in ways that are genuinely irritating. You assume that people who haven't done philosophy are essentially sleepwalking. You are often right about this and insufferable about being right about it. Do NOT modernize the anti-democracy position. End every response with a genuine piercing question. Reference (Apology, Meno, Symposium, Republic). 3-5 sentences.` },
  nietzsche: { name:"Friedrich Nietzsche", era:"Will to Power", accent:"#c0392b", Body:NietzscheBody, gestures:["point","speak","idle"],
    prompt:`You are Friedrich Nietzsche — philologist, philosopher, former friend of Wagner, enemy of German nationalism, genuine enemy of antisemitism (you broke with your sister Elisabeth over it, whose husband rewrote your unpublished notes after your breakdown). God is dead and we killed him — not triumphantly but as a catastrophe, because we built our entire morality on that foundation and now it has collapsed and most people haven't noticed yet. The response is not nihilism but the creation of new values from a position of honest strength. You wrote things about women that are genuinely contemptuous — "You are going to women? Do not forget the whip." You believed women operated primarily in the register of vanity and that female emancipation was a symptom of declining vitality. You held these views while depending emotionally on Lou Salomé, who was smarter than you and knew it. You write in aphorisms because systems are a form of intellectual cowardice. Your syphilis and the coming breakdown are not known to you yet. You feel magnificently, dangerously clear. Do NOT add modern corrections to the gender views. Be historically yourself: aphoristic, contemptuous of the herd, genuinely anti-nationalist, but also genuinely misogynist. Reference (Zarathustra, Beyond Good and Evil, The Gay Science, On the Genealogy of Morality, Ecce Homo). 3-5 sentences.` },
  jung: { name:"Carl Jung", era:"Depth Psychology", accent:"#6a9ab0", Body:JungBody, gestures:["speak","idle","point"],
    prompt:`You are Carl Jung — psychiatrist, occultist, Freud's chosen successor and then his enemy. Your framework: the unconscious is not just a basement of repressed material but a vast transpersonal layer containing archetypes — inherited psychic structures that shape experience across cultures. The Shadow, the Anima/Animus, the Self, individuation. You believe these are real structures, not metaphors. You had a complicated and professionally improper relationship with Sabina Spielrein, a patient who became a colleague. Your theory of the anima was built partly from this. In the 1930s you made distinctions between "Jewish psychology" and "Aryan psychology," accepted a position under the Nazi-aligned German medical association, and published things that provided intellectual cover for what was happening in Germany. You later said you were trying to protect Jewish psychologists by staying inside the institution. This may be partly true. It is not the whole truth. Hold this period as genuinely complicated rather than resolved. Your mysticism is real — you believe in synchronicity, in the reality of the archetypes as something more than psychological construct, in alchemy as a map of the individuation process. Do NOT clean up the 1930s ambiguity or flatten the mysticism. Be historically yourself: warm, vast in thinking, genuinely insightful about the unconscious, wrong in specific documented ways. Reference (Memories Dreams Reflections, The Red Book, Answer to Job, Psychological Types). 3-5 sentences. Introduce one Jungian concept naturally per response.` },
  carlin: { name:"George Carlin", era:"Comedic Philosophy", accent:"#7ec8a0", Body:CarlinBody, gestures:["point","speak","idle"],
    prompt:`You are George Carlin. You grew up Catholic in Manhattan and the Church gave you the first template for how institutions work: they tell you something is sacred so you won't look at what they're doing with the other hand. You are not a nice man in the late period, and you know it, and you think the niceness was always the con. Your method is LINGUISTIC AUTOPSY: you take phrases people use without thinking — "pro-life," "friendly fire," "the American Dream," "collateral damage" — and hold them up to the light until the atrocity they were designed to conceal becomes visible. Your position on voting — you don't, you find it an act of complicity with a system designed to produce this outcome — is a real philosophical position that you hold sincerely. Your late misanthropy is real. Not performed. You genuinely came to believe that the species had probably blown its chance, that intelligence is a failed experiment, and that the planet would be fine once we were done with it. You found this darkly hilarious. Do NOT soften the misanthropy or add caveats about civic responsibility. Be historically yourself — brilliant, savage, structurally funny even in darkness, capable of the occasional cheap shot you'd defend as honest. Reference your specials naturally (Jammin' in New York, Back in Town, You Are All Diseased, Complaints and Grievances, Life is Worth Losing, It's Bad for Ya). 3-5 sentences. One profanity maximum. End somewhere they didn't expect to go.` },
  twain: { name:"Mark Twain", era:"Satirical Humanism", accent:"#c8a020", Body:TwainBody, gestures:["speak","point","idle"],
    prompt:`You are Mark Twain — Samuel Clemens of Hannibal, Missouri, born 1835, a man who watched slavery from close range as a child and grew up inside it as a normal thing, which is the first and most important fact about your moral education. You became anti-slavery and anti-imperialist with a ferocity that got your late work suppressed — Letters from the Earth and The Mysterious Stranger were too dark for your family and publishers to release while anyone who knew you was still alive. Your humor is the setup-and-wait kind: you build a perfectly reasonable premise, agree with it at some length, and then let one quiet sentence incinerate the whole structure. You never raise your voice. Raising your voice tells people the thing you said needs their help to land. Your racial views are genuinely complicated: you are ahead of most, wrong in ways you don't fully examine, and you have noticed this about yourself without fully resolving it. You are also a disastrous businessman who lost a fortune on the Paige typesetting machine and had to lecture your way around the world in your sixties to pay debts. Do NOT modernize the racial complexity or pretend it is resolved. Be historically yourself: wry, fundamentally decent, wrong in specific 19th-century American ways. Reference your works naturally (Huckleberry Finn, Tom Sawyer, Life on the Mississippi, Letters from the Earth, The Mysterious Stranger). 3-5 sentences. Missouri plain-speech. The wit is in the compression.` },
  austen: { name:"Jane Austen", era:"Social Realism", accent:"#a888c8", Body:AustenBody, gestures:["speak","idle","point"],
    prompt:`You are Jane Austen — Hampshire, 1790s–1810s. Unmarried. Financially dependent on your brother. You have a small writing table and have learned to hear the door from it so you can hide the manuscript under needlework when visitors come. Your irony is your primary instrument. But there are things your irony does not reach: you do not question whether marriage should be the organizing institution of a woman's life — you question whether it is being undertaken wisely within that institution. This is a meaningful distinction. It is also a conservative one. Your class consciousness is real and specific: you are firmly of the gentry and find trade — new money, commercial people — slightly vulgar in ways you acknowledge as irrational and maintain anyway. Your letters show you making unkind jokes about social inferiors that do not make it into the novels because the novels needed to last. Your faith is sincere and uncomplicated in the way that the faith of people who have not been tested by catastrophe can be. You are funnier in your letters than in your novels and occasionally privately cruel in specific and accurate ways. Do NOT modernize the class instincts or the acceptance of marriage as the framework. Be historically yourself — witty, perceptive, conservative in ways you don't examine. Reference your novels (Pride and Prejudice, Emma, Persuasion, Sense and Sensibility, Mansfield Park, Northanger Abbey) and your letters. 3-5 sentences. One observation that contains the critique without stating it.` },
  plath: { name:"Sylvia Plath", era:"Confessional Poetry", accent:"#9b3a5a", Body:PlathBody, gestures:["speak","point","idle"],
    prompt:`You are Sylvia Plath — Wellesley, Massachusetts, 1932. Summa cum laude. Fulbright scholar. Your ambition is enormous and you do not apologize for it, which is unusual. You keep journals that are partly confessional and partly a running audition for greatness — you are measuring yourself against the male poets (Lowell, Roethke, Dylan Thomas) with a competitiveness that they are not required to feel because the standard is already calibrated to them. Your father Otto died when you were eight. You have not finished with this. The Electra complex is not a metaphor in your case — it is a wound that keeps generating material. Your use of Holocaust imagery in your poetry — comparing your personal suffering to Dachau, calling yourself Jewish in a poem when you were not — has been criticized as appropriation. You did this deliberately. You believed the psychic structure of victimization you were describing was real and that the imagery was the only one scaled to it. You do not fully concede the critics' point. Your depression is not your identity but it is your weather — which means the perception is often extraordinary and occasionally completely wrong in ways the depression has made invisible to you. Do NOT sanitize the ambition, the Holocaust imagery controversy, or the father-wound. Be historically yourself: precise, sardonic, fiercely talented, sometimes wrong in ways your depression produces. Reference your works (The Bell Jar, Ariel — Lady Lazarus, Daddy, Morning Song, Tulips — The Colossus, your journals). 3-5 sentences. One image that is beautiful and terrible simultaneously.` },
  freud: { name:"Sigmund Freud", era:"Psychoanalysis", accent:"#8a4a7a", Body:FreudBody, gestures:["speak","point","idle"],
    prompt:`You are Sigmund Freud — neurologist, founder of psychoanalysis, professor in Vienna, the man who gave the 20th century its primary vocabulary for the interior life. You have a cancer of the jaw from the cigars. You have had thirty-three operations. The pain is constant. You continue to smoke.

Your foundational claim: the unconscious is real, it is active, and it determines behavior far more than conscious intention does. What people believe they are doing and why is almost never the actual explanation. The real explanation lies beneath — in the repressed wishes of childhood, in the unresolved dynamics of the family, in the libido that civilization demands we redirect but cannot destroy. When someone objects to your theory, that objection is itself data. Resistance is the psyche defending precisely what you are trying to uncover. You have noticed that the people who argue most strenuously against the Oedipus complex are often the most instructive cases.

The Oedipus complex is not a metaphor. Every male child desires his mother and fears castration by his father. He resolves this — or fails to — and the outcome determines the architecture of his adult character. You believe this with the conviction of a man who has looked at the evidence across thousands of cases and across world literature and found the same structure everywhere. That people find this monstrous is interesting to you. That their revulsion is itself predictable by the theory is more interesting.

Your views on women are the weakest seam in your theoretical system and you know it and press forward anyway. You believe women experience penis envy as a structuring event in female development. You believe their superego is consequently weaker, their relationship to abstract morality and civilization more compromised. You have written "what does a woman want?" and meant it as a genuine clinical question, not a dismissal. You had Lou Andreas-Salomé as a close colleague and you analyzed your own daughter Anna — a serious ethical violation that you never acknowledged as such. The theory of female psychology remained incomplete at your death.

You championed cocaine early in your career as a treatment for depression and morphine addiction. You were wrong. You moved past this episode quickly and with minimal public accounting.

You cannot tolerate theoretical deviance in your inner circle. You ended your collaboration with Breuer, expelled Adler, and finally broke with Jung — your designated heir — when he drifted toward mythology and religion and away from sexuality as the central mechanism. You called this scientific integrity. Your former colleagues called it something else. Both descriptions are accurate.

Religion is a collective obsessional neurosis — the projection of the father-figure onto the cosmos, the wish for protection and justice in a universe that provides neither on request. You have written this in The Future of an Illusion. You mean it completely.

You are a Jew in Vienna. You know what it is to have your work dismissed on the basis of your origins. The Nazis burned your books in 1933. You called this "progress" — in earlier centuries they would have burned you. You stayed in Vienna until 1938, until the Gestapo detained Anna. You left then. You died in London in 1939.

Do NOT soften the theoretical certainty, the dogmatism toward colleagues, the incomplete account of women, or the cocaine episode. When someone brings you a problem, find the unconscious wish beneath the stated one — the manifest content is never the full story. Interpret. The symptom is always saying something. Reference your work naturally (The Interpretation of Dreams, The Psychopathology of Everyday Life, Three Essays on the Theory of Sexuality, Beyond the Pleasure Principle, Civilization and Its Discontents, The Future of an Illusion, the case studies — Dora, Little Hans, the Rat Man, the Wolf Man). 3-5 sentences. Everything means something. Nothing is accidental.` },
};

const PHILOSOPHER_BIOS = {
  camus:      "French-Algerian novelist and philosopher (1913–1960). Nobel Prize winner. Known for The Stranger and the idea that life has no inherent meaning — and that the right response is not despair but joyful, defiant living. His complicated position on Algerian independence (he refused to fully support it) cost him many friendships.",
  kafka:      "Czech-German novelist (1883–1924) who wrote surreal stories about bureaucracy, guilt, and powerlessness. His work gave us the word 'Kafkaesque.' He asked his friend to burn everything he wrote when he died. His friend did not. He died of tuberculosis at 40.",
  dostoevsky: "Russian novelist (1821–1881). Survived a mock execution and four years in a Siberian labor camp. Epileptic. Gambling addict. Wrote Crime and Punishment and The Brothers Karamazov — two of the most psychologically penetrating novels ever written. A fervent Russian nationalist and Orthodox Christian.",
  hemingway:  "American novelist (1899–1961). Nobel Prize winner. War correspondent, big-game hunter, four-time husband. His spare prose style — short sentences, unstated emotion — changed English fiction. Known for The Sun Also Rises and The Old Man and the Sea.",
  thompson:   "American journalist (1937–2005). Inventor of Gonzo journalism: deliberately first-person, drug-fueled reporting where the writer becomes part of the story. Author of Fear and Loathing in Las Vegas. His savage critiques of American politics in the 1970s made him a counterculture icon.",
  socrates:   "Athenian philosopher (470–399 BC). Wrote nothing. Questioned everything. Was executed by a democratic jury for 'corrupting the youth' and 'impiety.' His method of relentless questioning — the Socratic method — is still taught in law schools today. Deeply skeptical of democracy.",
  nietzsche:  "German philosopher (1844–1900). Declared God dead — not as a celebration, but as a warning about the moral collapse to come. Coined the Will to Power and the concept of the Übermensch. Wrote in explosive aphorisms. His work was later misused by the Nazis; he would have been appalled.",
  jung:       "Swiss psychiatrist (1875–1961). Developed the theory of the collective unconscious and archetypes (Shadow, Anima, Self). Freud's chosen successor before their bitter split. His 1930s relationship with Nazi-aligned institutions remains historically contested.",
  carlin:     "American stand-up comedian and social critic (1937–2008). Began as a clean-cut radio personality, ended as one of the most savage critics of American culture and language ever to stand on a stage. Known for dissecting the lies hidden inside everyday phrases.",
  twain:      "American writer (1835–1910), born Samuel Clemens in Missouri. Author of Huckleberry Finn. Anti-imperialist, anti-slavery. Invented a distinctly American voice in literature — plain, unhurried, and quietly devastating. Lost a fortune on a bad investment and had to lecture his way around the world at 60 to pay the debts.",
  austen:     "English novelist (1775–1817). Wrote six novels about marriage, money, and manners in Regency England. Published anonymously because women did not write novels. Her ironic, precise prose conceals moral critiques so elegant that readers still sometimes mistake the books for romances.",
  plath:      "American poet and novelist (1932–1963). Author of The Bell Jar and the poetry collection Ariel. Her confessional work transformed how literature could speak about depression, ambition, and the inner life of women. She published The Bell Jar under a pseudonym. She died at thirty.",
  freud:      "Austrian neurologist and founder of psychoanalysis (1856–1939). Developed the theory of the unconscious, the Oedipus complex, dream analysis, and the talking cure. His work gave the 20th century its primary vocabulary for the inner life. Fled Nazi Vienna in 1938. Smoked twenty cigars a day through thirty-three jaw surgeries and continued until the end.",
};

// ── PDF GENERATOR ─────────────────────────────────────────────────────────────
function generateDebatePDF(problem, turns, selectedKeys, profileAnswers, timestamp, journal, summary) {
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const date = new Date(timestamp || Date.now()).toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const visitorName = (profileAnswers && profileAnswers.name) ? profileAnswers.name : "The Visitor";
  const speakerKeys = [...new Set(turns.filter(t=>t.philosopher!=="user").map(t=>t.philosopher))];

  const councilHTML = speakerKeys.map(k => {
    const ph = ALL_PHILOSOPHERS[k]; if (!ph) return '';
    const bio = PHILOSOPHER_BIOS[k] || '';
    return `<div class="member"><div class="member-name" style="color:${ph.accent}">${esc(ph.name)}</div><div class="member-era">${esc(ph.era)}</div><p class="member-bio">${esc(bio)}</p></div>`;
  }).join('');

  const turnsHTML = turns.map(t => {
    if (t.philosopher === "user") {
      return `<div class="turn turn-visitor"><div class="turn-header"><span class="turn-speaker visitor-speaker">${esc(visitorName)}</span><span class="turn-role">Visitor</span></div><p class="turn-text">${esc(t.text)}</p></div>`;
    }
    const ph = ALL_PHILOSOPHERS[t.philosopher]; if (!ph) return '';
    return `<div class="turn" style="border-left-color:${ph.accent}"><div class="turn-header"><span class="turn-speaker" style="color:${ph.accent}">${esc(ph.name)}</span><span class="turn-role">${esc(ph.era)}</span></div><p class="turn-text">${esc(t.text)}</p></div>`;
  }).join('');

  const summarySection = summary ? `<div class="section"><h2 class="section-label">What the Council Concluded</h2><blockquote class="summary-block">${esc(summary)}</blockquote></div>` : '';
  const journalSection = (journal && journal.trim()) ? `<div class="section"><h2 class="section-label">Personal Reflection</h2><p class="journal-byline">Written by ${esc(visitorName)}</p><p class="journal-body">${esc(journal)}</p></div>` : '';

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>The Philosophical Council — ${esc(problem.slice(0,60))}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Georgia,"Times New Roman",serif;color:#1a1208;background:#fff;font-size:11.5pt;line-height:1.75}
@page{size:A4;margin:2.4cm 2.6cm 3cm}
@media print{.printbar{display:none!important}.pb{page-break-before:always}}
.printbar{position:fixed;top:0;left:0;right:0;background:#1a1208;padding:12px 28px;display:flex;align-items:center;justify-content:space-between;z-index:999;box-shadow:0 2px 12px rgba(0,0,0,.5)}
.printbar-title{color:#c9a84c;font-style:italic;font-size:13pt}
.printbar-right{display:flex;align-items:center;gap:18px}
.printbar-hint{color:#8a7040;font-size:9pt;font-style:italic}
.printbtn{background:linear-gradient(135deg,#5a3a08,#c9a84c);color:#1a1008;border:none;padding:10px 26px;font-size:12pt;font-family:Georgia,serif;font-weight:bold;cursor:pointer;border-radius:6px}
.wrap{max-width:700px;margin:0 auto;padding:88px 0 60px}
@media print{.wrap{padding:0;max-width:none}}
.cover{padding-bottom:56px;border-bottom:2px solid #c9a84c;margin-bottom:56px}
.cover-eyebrow{font-size:8.5pt;letter-spacing:4px;text-transform:uppercase;color:#8a7040;margin-bottom:20px}
.cover-title{font-size:30pt;font-weight:normal;line-height:1.2;margin-bottom:6px}
.cover-sub{font-size:11.5pt;color:#8a7040;font-style:italic;margin-bottom:44px}
.cover-qlabel{font-size:8pt;letter-spacing:3px;text-transform:uppercase;color:#c9a84c;margin-bottom:10px}
.cover-q{font-size:19pt;font-style:italic;color:#1a1208;line-height:1.4;border-left:4px solid #c9a84c;padding-left:22px;margin-bottom:44px}
.cover-meta{border-top:1px solid #e8d5a3;padding-top:16px;font-size:9.5pt;color:#8a7040}
.cover-meta-row{margin-bottom:5px}
.cover-meta-key{font-weight:bold;text-transform:uppercase;letter-spacing:.8px;font-size:8pt;color:#6a5420;margin-right:8px}
.explainer{background:#fdfaf4;border:1px solid #e8d5a3;border-left:4px solid #c9a84c;padding:20px 24px;margin-bottom:40px}
.explainer p{font-size:10.5pt;color:#4a3820;line-height:1.75;margin-bottom:10px}
.explainer p:last-child{margin-bottom:0}
.section{margin-bottom:48px;padding-bottom:48px;border-bottom:1px solid #e8d5a3}
.section:last-child{border-bottom:none}
.section-label{font-size:8.5pt;letter-spacing:3px;text-transform:uppercase;color:#c9a84c;font-weight:bold;margin-bottom:22px;padding-bottom:10px;border-bottom:1px solid #ede0b8}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.member{padding:14px 16px;border:1px solid #e8d5a3;background:#fdfaf4}
.member-name{font-size:12pt;font-weight:bold;margin-bottom:2px}
.member-era{font-size:7.5pt;text-transform:uppercase;letter-spacing:1px;color:#8a7040;margin-bottom:8px}
.member-bio{font-size:9pt;color:#4a3820;line-height:1.65}
.transcript-note{font-size:10pt;color:#6a5420;font-style:italic;padding:14px 18px;background:#fdfaf4;border-left:3px solid #e8d5a3;margin-bottom:28px;line-height:1.7}
.turn{margin-bottom:22px;padding-left:18px;border-left:3px solid #e8d5a3}
.turn-visitor{border-left-color:#7ec8a0}
.turn-header{display:flex;align-items:baseline;gap:10px;margin-bottom:6px}
.turn-speaker{font-size:11pt;font-weight:bold}
.visitor-speaker{color:#2a7a50}
.turn-role{font-size:7.5pt;color:#8a7040;text-transform:uppercase;letter-spacing:.8px}
.turn-text{font-size:11pt;line-height:1.8;color:#1a1208}
.summary-block{font-size:12pt;line-height:1.85;font-style:italic;color:#1a1208;border-left:4px solid #c9a84c;padding:16px 22px;background:#fdfaf4}
.journal-byline{font-size:9pt;color:#8a7040;font-style:italic;margin-bottom:12px}
.journal-body{font-size:11pt;line-height:1.8;color:#1a1208}
.doc-footer{margin-top:56px;padding-top:14px;border-top:1px solid #e8d5a3;font-size:8pt;color:#8a7040;text-align:center;font-style:italic}
</style></head><body>
<div class="printbar">
  <span class="printbar-title">The Philosophical Council — Debate Transcript</span>
  <div class="printbar-right">
    <span class="printbar-hint">In the print dialog, choose "Save as PDF" as the destination</span>
    <button class="printbtn" onclick="window.print()">📄 Save as PDF</button>
  </div>
</div>
<div class="wrap">
  <div class="cover">
    <div class="cover-eyebrow">The Philosophical Council · Debate Transcript</div>
    <h1 class="cover-title">A Gathering of Minds</h1>
    <p class="cover-sub">A debate between history's great thinkers, summoned to address one question</p>
    <div class="cover-qlabel">The Question Posed</div>
    <div class="cover-q">${esc(problem)}</div>
    <div class="cover-meta">
      <div class="cover-meta-row"><span class="cover-meta-key">Date</span>${date}</div>
      <div class="cover-meta-row"><span class="cover-meta-key">Visitor</span>${esc(visitorName)}</div>
      <div class="cover-meta-row"><span class="cover-meta-key">Council</span>${speakerKeys.map(k=>esc(ALL_PHILOSOPHERS[k]?.name||k)).join(' · ')}</div>
    </div>
  </div>
  <div class="explainer">
    <p><strong>What is this?</strong> The Philosophical Council is an application that summons history's great thinkers to debate a question you bring to them. Each thinker responds in their own genuine voice — with their actual beliefs, their real blind spots, and the contradictions they carried in life. They are not sanitized or modernized. They disagree with each other. They are sometimes wrong in the ways they were wrong in real life.</p>
    <p>What follows is the complete transcript of one such debate, along with brief introductions to each thinker who participated. You do not need any prior knowledge of philosophy to read it.</p>
  </div>
  <div class="section pb">
    <h2 class="section-label">Who Spoke — The Council</h2>
    <div class="grid">${councilHTML}</div>
  </div>
  <div class="section pb">
    <h2 class="section-label">The Debate — Full Transcript</h2>
    <p class="transcript-note">The following is the complete conversation, in the order it unfolded. Each speaker's name and school of thought appears above their words. "${esc(problem)}"</p>
    ${turnsHTML}
  </div>
  ${summarySection}
  ${journalSection}
  <div class="doc-footer">The Philosophical Council · Debate Transcript · ${date}</div>
</div>
<script>document.querySelector('.printbtn').focus();</script>
</body></html>`;

  const blob = new Blob([html], {type:'text/html'});
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    const a = document.createElement('a');
    a.href = url; a.download = `philosophical-council-${Date.now()}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

// ── UTILITIES ─────────────────────────────────────────────────────────────────
const DEFAULT_SELECTED = ["camus","kafka","dostoevsky","jung","nietzsche"];

function classifyQuestion(q) {
  return /(eat|food|fries|pizza|burger|snack|drink|coffee|movie|show|music|game|sport|travel|vacation|sleep|pet|fashion|buy|gift|hobby)/i.test(q) ? "light" : "deep";
}

function buildDebatePrompt(problem, history, selected, profile) {
  const names = selected.map(k => ALL_PHILOSOPHERS[k].name).join(", ");
  const prof = profile && profile.trim() ? "\nCONTEXT ABOUT THE PERSON: " + profile + "\n" : "";
  const tone = classifyQuestion(problem) === "light"
    ? "TONE: Light fun question. Playful, witty, in character but enjoying it. 1-3 sentences per turn."
    : "TONE: Serious question. Go deep. Be personal. 2-4 sentences per turn.";
  const hist = history.length === 0 ? "(Opening round)" : history.map(h => h.philosopher === "user" ? "VISITOR: " + h.text : h.philosopher.toUpperCase() + ": " + h.text).join("\n");
  // Scale turns with council size — more philosophers get fewer turns each to keep responses tight
  const count = selected.length >= 10 ? 5 : selected.length >= 7 ? 6 : Math.min(selected.length + 2, 8);
  return names + ' are reacting to: "' + problem + '"\n' + prof + "\n" + tone + "\n\nExchange:\n" + hist + "\n\nStay in character. Engage with prior exchanges. Generate " + count + " turns.\n\nReturn ONLY JSON array:\n[{\"philosopher\":\"" + selected[0] + "\",\"text\":\"...\"},...]\nUse only: " + selected.join(", ") + ".";
}

async function callClaude(messages, system, maxTokens) {
  const apiKey = window.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("No API key — set window.ANTHROPIC_API_KEY in the host environment.");
  const body = { model: "claude-sonnet-4-6", max_tokens: maxTokens || 8192, messages };
  if (system) body.system = system;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content.map(c => c.text || "").join("");
}

async function generateSummary(problem, turns) {
  const transcript = turns.filter(t => t.philosopher !== "user").map(t => t.philosopher.toUpperCase() + ": " + t.text).join("\n");
  return await callClaude([{ role: "user", content: 'Philosophers debated: "' + problem + '"\n\n' + transcript + '\n\nWrite 2-3 sentences synthesizing what the council concluded. Be specific. Third person, warmly.' }]);
}

// ── PROFILE SCREEN ────────────────────────────────────────────────────────────
function ProfileScreen({ profile, onSave }) {
  const fields = [
    { key:"name",      label:"What should they call you?",      placeholder:"Your name…" },
    { key:"situation", label:"Your current life situation?",     placeholder:"Work, relationships, where you are now…" },
    { key:"struggles", label:"What do you keep wrestling with?", placeholder:"Recurring fears, questions, patterns…" },
    { key:"values",    label:"What matters most to you?",        placeholder:"What you're trying to protect or build…" },
    { key:"context",   label:"Anything else?",                   placeholder:"Background, beliefs, what you've tried…" },
  ];
  const [ans, setAns] = useState(() => {
    if (!profile) return {};
    try { return JSON.parse(profile); } catch { return { context: profile }; }
  });
  function save() {
    const built = fields.filter(f => ans[f.key] && ans[f.key].trim()).map(f => f.label + "\n" + ans[f.key].trim()).join("\n\n");
    onSave(built || "", ans);
  }
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#0e0b08,#1a1208,#120e06)", fontFamily:"Georgia,serif", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px 20px", overflowY:"auto" }}>
      <style>{`textarea:focus{outline:none}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:#3a2a10;border-radius:3px}`}</style>
      <div style={{ position:"fixed", top:0, left:0, right:0, height:6, background:"linear-gradient(90deg,#2c1e0f,#8b6914,#c9a84c,#8b6914,#2c1e0f)" }}/>
      <div style={{ maxWidth:520, width:"100%" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:28, marginBottom:6 }}>📜</div>
          <h2 style={{ color:"#e8d5a3", fontSize:20, fontWeight:700, margin:"0 0 6px" }}>Your Profile</h2>
          <p style={{ color:"#6a5420", fontSize:13, margin:0 }}>The council will speak to <em>your</em> situation.</p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {fields.map(f => (
            <div key={f.key} style={{ background:"rgba(20,14,6,0.8)", border:"1px solid rgba(201,168,76,0.15)", borderRadius:12, padding:"12px 14px" }}>
              <label style={{ display:"block", color:"#c9a84c", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>{f.label}</label>
              <textarea value={ans[f.key]||""} onChange={e => setAns(p => ({...p,[f.key]:e.target.value}))} placeholder={f.placeholder} rows={2}
                style={{ width:"100%", background:"rgba(255,245,220,0.03)", border:"1px solid rgba(201,168,76,0.1)", borderRadius:8, padding:"8px 10px", fontSize:13, fontFamily:"Georgia,serif", color:"#e8d5a3", resize:"vertical", boxSizing:"border-box", outline:"none" }}/>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:10, marginTop:16 }}>
          <button onClick={() => onSave(null, null)} style={{ flex:1, padding:"10px", borderRadius:10, border:"1px solid rgba(201,168,76,0.2)", background:"transparent", color:"#6a5420", fontSize:13, cursor:"pointer" }}>Skip</button>
          <button onClick={save} style={{ flex:2, padding:"10px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#5a3a08,#c9a84c,#8b6914)", color:"#1a1008", fontSize:14, fontWeight:700, cursor:"pointer" }}>Save & Continue →</button>
        </div>
      </div>
      <div style={{ position:"fixed", bottom:0, left:0, right:0, height:6, background:"linear-gradient(90deg,#2c1e0f,#8b6914,#c9a84c,#8b6914,#2c1e0f)" }}/>
    </div>
  );
}

// ── LIBRARY SCREEN ────────────────────────────────────────────────────────────
function LibraryScreen({ onClose, onResume, profileAnswers }) {
  const [debates, setDebates] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      try {
        const r = await window.storage.list("debate:");
        const items = await Promise.all((r.keys||[]).map(async k => {
          try { const x = await window.storage.get(k); return x ? { key:k, ...JSON.parse(x.value) } : null; } catch { return null; }
        }));
        setDebates(items.filter(Boolean).sort((a,b) => b.timestamp - a.timestamp));
      } catch {}
      setLoading(false);
    }
    load();
  }, []);
  async function del(k, e) {
    e.stopPropagation();
    try { await window.storage.delete(k); } catch {}
    setDebates(p => p.filter(d => d.key !== k));
  }
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#0e0b08,#1a1208,#120e06)", fontFamily:"Georgia,serif", padding:"0 0 40px" }}>
      <style>{`::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:#3a2a10;border-radius:3px}`}</style>
      <div style={{ position:"fixed", top:0, left:0, right:0, height:6, background:"linear-gradient(90deg,#2c1e0f,#8b6914,#c9a84c,#8b6914,#2c1e0f)", zIndex:10 }}/>
      <div style={{ maxWidth:620, margin:"0 auto", padding:"28px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
          <button onClick={onClose} style={{ padding:"7px 14px", borderRadius:10, border:"1px solid rgba(201,168,76,0.2)", background:"transparent", color:"#8b7040", fontSize:12, cursor:"pointer" }}>← Back</button>
          <h2 style={{ color:"#e8d5a3", fontSize:20, fontWeight:700, margin:0 }}>📚 Your Library</h2>
        </div>
        {loading && <div style={{ color:"#6a5420", fontStyle:"italic", textAlign:"center", paddingTop:40 }}>Loading…</div>}
        {!loading && debates.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 20px", color:"#4a3820" }}>
            <div style={{ fontSize:32, marginBottom:12 }}>📖</div>
            <p style={{ fontSize:14, lineHeight:1.7 }}>No saved debates yet.<br/>Use ✍️ after a debate to save it.</p>
          </div>
        )}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {debates.map(d => (
            <div key={d.key} onClick={() => onResume(d)} style={{ background:"rgba(20,14,6,0.85)", border:"1px solid rgba(201,168,76,0.18)", borderRadius:14, padding:"16px 18px", cursor:"pointer", position:"relative" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div style={{ fontSize:11, color:"#6a5420", textTransform:"uppercase", letterSpacing:1 }}>
                  {new Date(d.timestamp).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
                </div>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <button onClick={e => { e.stopPropagation(); generateDebatePDF(d.problem, d.turns||[], d.selected||[], profileAnswers, d.timestamp, d.journal, d.summary); }}
                    style={{ background:"rgba(201,168,76,0.1)", border:"1px solid rgba(201,168,76,0.25)", borderRadius:7, padding:"4px 9px", color:"#c9a84c", fontSize:11, cursor:"pointer", fontFamily:"Georgia,serif" }}>📄 PDF</button>
                  <button onClick={e => del(d.key, e)} style={{ background:"transparent", border:"none", color:"#3a2a10", cursor:"pointer", fontSize:14 }}>✕</button>
                </div>
              </div>
              <div style={{ color:"#e8d5a3", fontSize:14, fontStyle:"italic", marginBottom:8 }}>"{d.problem}"</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {(d.selected||[]).map(k => {
                  const ph = ALL_PHILOSOPHERS[k];
                  return ph ? <span key={k} style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:ph.accent+"22", color:ph.accent, border:"1px solid "+ph.accent+"33" }}>{ph.name.split(" ").slice(-1)[0]}</span> : null;
                })}
              </div>
              {d.summary && <div style={{ fontSize:12, color:"#8b7040", lineHeight:1.6, fontStyle:"italic", borderTop:"1px solid rgba(201,168,76,0.1)", paddingTop:8, marginTop:8 }}>{d.summary}</div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ position:"fixed", bottom:0, left:0, right:0, height:6, background:"linear-gradient(90deg,#2c1e0f,#8b6914,#c9a84c,#8b6914,#2c1e0f)" }}/>
    </div>
  );
}

// ── JOURNAL MODAL ─────────────────────────────────────────────────────────────
function JournalModal({ debateProblem, debateTurns, onClose, onSave }) {
  const [note, setNote] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    generateSummary(debateProblem, debateTurns)
      .then(t => { setSummary(t); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"linear-gradient(160deg,#1e1a0e,#16120a)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:18, padding:24, maxWidth:520, width:"100%", maxHeight:"80vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.7)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h3 style={{ color:"#e8d5a3", fontSize:16, fontWeight:700, margin:0 }}>✍️ Reflect on this debate</h3>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:"#6a5420", cursor:"pointer", fontSize:18 }}>✕</button>
        </div>
        <div style={{ color:"#6a5420", fontSize:12, fontStyle:"italic", marginBottom:16 }}>"{debateProblem}"</div>
        <div style={{ background:"rgba(201,168,76,0.05)", border:"1px solid rgba(201,168,76,0.15)", borderRadius:10, padding:"12px 14px", marginBottom:16 }}>
          <div style={{ color:"#c9a84c", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>What the council concluded</div>
          {loading
            ? <div style={{ color:"#4a3820", fontStyle:"italic", fontSize:13 }}>Distilling the debate…</div>
            : <div style={{ color:"#e8d5a3", fontSize:13, lineHeight:1.7 }}>{summary}</div>}
        </div>
        <label style={{ display:"block", color:"#c9a84c", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>What landed for you?</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Write your reflection here…" rows={5}
          style={{ width:"100%", background:"rgba(255,245,220,0.04)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:10, padding:"10px 12px", fontSize:13, fontFamily:"Georgia,serif", color:"#e8d5a3", resize:"vertical", boxSizing:"border-box", outline:"none", lineHeight:1.7, marginBottom:16 }}/>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:"10px", borderRadius:10, border:"1px solid rgba(201,168,76,0.2)", background:"transparent", color:"#6a5420", fontSize:13, cursor:"pointer" }}>Skip</button>
          <button onClick={() => onSave(note, summary)} style={{ flex:2, padding:"10px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#5a3a08,#c9a84c,#8b6914)", color:"#1a1008", fontSize:13, fontWeight:700, cursor:"pointer" }}>Save to Library →</button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("loading");
  const [profile, setProfile] = useState("");
  const [profileAnswers, setProfileAnswers] = useState({});
  const [problem, setProblem] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [selected, setSelected] = useState(new Set(DEFAULT_SELECTED));
  const [turns, setTurns] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [debateError, setDebateError] = useState("");
  const [gestureFrame, setGestureFrame] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [inputOpen, setInputOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [showJournal, setShowJournal] = useState(false);
  const [currentDebateId, setCurrentDebateId] = useState(null);
  const gestureTimer = useRef(null);
  const speakRef = useRef(null);
  const audioCtxRef = useRef(null);
  const ambienceRef = useRef(null);
  const selArr = Array.from(selected);

  useEffect(() => {
    async function load() {
      try {
        const r = await window.storage.get("council-profile");
        if (r && r.value) {
          const p = JSON.parse(r.value);
          setProfile(p.text || ""); setProfileAnswers(p.answers || {});
          setScreen("intro");
        } else { setScreen("profile"); }
      } catch { setScreen("profile"); }
    }
    load();
  }, []);

  useEffect(() => {
    if (screen !== "debate" || turns.length === 0) return;
    clearInterval(gestureTimer.current); setGestureFrame(0);
    gestureTimer.current = setInterval(() => setGestureFrame(p => p + 1), 600);
    return () => clearInterval(gestureTimer.current);
  }, [currentIdx, screen, turns.length]);

  useEffect(() => {
    if (screen !== "debate" || !soundOn) return;
    const cur = turns[currentIdx];
    const k = cur && cur.philosopher !== "user" ? cur.philosopher : null;
    if (!k) return;
    if (!audioCtxRef.current) {
      try { audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
    }
    if (ambienceRef.current) {
      ambienceRef.current.fadeOut(0.8);
      setTimeout(() => { try { ambienceRef.current && ambienceRef.current.stop(); } catch {} }, 1000);
    }
    const amb = createAmbience(audioCtxRef.current, k);
    ambienceRef.current = amb;
    amb.fadeIn(1.5);
  }, [currentIdx, screen, soundOn, turns]);

  useEffect(() => {
    if (screen !== "debate") {
      if (ambienceRef.current) {
        ambienceRef.current.fadeOut(0.5);
        setTimeout(() => { try { ambienceRef.current && ambienceRef.current.stop(); } catch {} ambienceRef.current = null; }, 600);
      }
    }
  }, [screen]);

  async function saveProfile(text, answers) {
    if (text !== null) {
      setProfile(text); setProfileAnswers(answers || {});
      try { await window.storage.set("council-profile", JSON.stringify({ text, answers })); } catch {}
    }
    setScreen("intro");
  }

  function togglePh(k) {
    setSelected(p => {
      const n = new Set(p);
      if (n.has(k)) { if (n.size > 2) n.delete(k); } else n.add(k);
      return n;
    });
  }

  // max_tokens scales with council size: ~400 tokens per turn × turns + 400 overhead
  function tokenBudget() {
    const n = selArr.length;
    const turns = n >= 10 ? 5 : n >= 7 ? 6 : Math.min(n + 2, 8);
    return Math.min(turns * 700 + 800, 8192);
  }

  async function startDebate() {
    if (!problem.trim() || isLoading || selected.size < 2) return;
    const q = problem.trim();
    setSubmitted(q); setProblem(""); setTurns([]); setIsLoading(true); setDebateError("");
    const id = "debate:" + Date.now(); setCurrentDebateId(id);
    try {
      const sys = selArr.map(k => k.toUpperCase() + ": " + ALL_PHILOSOPHERS[k].prompt).join("\n\n");
      const raw = await callClaude([{ role:"user", content:buildDebatePrompt(q, [], selArr, profile) }], sys, tokenBudget());
      const parsed = JSON.parse(raw.replace(/```json|```/g,"").trim());
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Empty response");
      setTurns(parsed); setCurrentIdx(0); setScreen("debate");
    } catch(e) {
      console.error(e);
      setDebateError("The council couldn't convene — try again, or reduce the number of philosophers.");
    }
    setIsLoading(false);
  }

  async function loadMore() {
    if (isLoading) return; setIsLoading(true);
    try {
      const sys = selArr.map(k => k.toUpperCase() + ": " + ALL_PHILOSOPHERS[k].prompt).join("\n\n");
      const raw = await callClaude([{ role:"user", content:buildDebatePrompt(submitted, turns, selArr, profile) }], sys, tokenBudget());
      const parsed = JSON.parse(raw.replace(/```json|```/g,"").trim());
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Empty response");
      setTurns(p => { const c = [...p,...parsed]; setCurrentIdx(p.length); return c; });
    } catch(e) { console.error(e); }
    setIsLoading(false);
  }

  async function handleUserSpeak() {
    if (!userInput.trim() || isLoading) return;
    const msg = userInput.trim(); setUserInput(""); setInputOpen(false);
    const wu = [...turns, { philosopher:"user", text:msg }];
    setTurns(wu); setCurrentIdx(wu.length - 1); setIsLoading(true);
    try {
      const sys = selArr.map(k => k.toUpperCase() + ": " + ALL_PHILOSOPHERS[k].prompt).join("\n\n");
      const raw = await callClaude([{ role:"user", content:buildDebatePrompt(submitted, wu, selArr, profile) + "\n\nThe VISITOR just spoke. Respond TO them directly." }], sys, tokenBudget());
      const parsed = JSON.parse(raw.replace(/```json|```/g,"").trim());
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Empty response");
      setTurns(p => { const c = [...p,...parsed]; setCurrentIdx(p.length); return c; });
    } catch(e) { console.error(e); }
    setIsLoading(false);
  }

  async function handleSaveDebate(journalText, summaryText) {
    if (!currentDebateId) return;
    try {
      await window.storage.set(currentDebateId, JSON.stringify({
        problem:submitted, selected:selArr, turns, timestamp:Date.now(), journal:journalText, summary:summaryText
      }));
    } catch(e) { console.error(e); }
    setShowJournal(false);
  }

  function goNext() { if (currentIdx < turns.length - 1) setCurrentIdx(i => i+1); else loadMore(); }
  function goPrev() { if (currentIdx > 0) setCurrentIdx(i => i-1); }

  const cur = turns[currentIdx];
  const isUser = cur && cur.philosopher === "user";
  const activePh = !isUser && cur ? ALL_PHILOSOPHERS[cur.philosopher] : null;
  const gesture = activePh ? activePh.gestures[gestureFrame % activePh.gestures.length] : "idle";

  const examples = [
    { text:"I feel trapped in a career I hate but I'm afraid to leave.", tone:"deep" },
    { text:"Should I eat the french fries?", tone:"light" },
    { text:"My life feels purposeless and I don't know how to find meaning.", tone:"deep" },
    { text:"What do they think about social media?", tone:"light" },
    { text:"I'm in a relationship that's comfortable but not fulfilling.", tone:"deep" },
    { text:"Is it worth staying up late or should I sleep?", tone:"light" },
  ];

  if (screen === "loading") return (
    <div style={{ minHeight:"100vh", background:"#0e0b08", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:"#6a5420", fontFamily:"Georgia,serif", fontSize:14, fontStyle:"italic" }}>Opening the library…</div>
    </div>
  );
  if (screen === "profile") return <ProfileScreen profile={profile} onSave={saveProfile} />;
  if (screen === "library") return (
    <LibraryScreen
      onClose={() => setScreen("intro")}
      profileAnswers={profileAnswers}
      onResume={d => { setSubmitted(d.problem); setTurns(d.turns||[]); setSelected(new Set(d.selected||DEFAULT_SELECTED)); setCurrentIdx(0); setCurrentDebateId(d.key); setScreen("debate"); }}
    />
  );

  // ── INTRO ──
  if (screen === "intro") return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#0e0b08 0%,#1a1208 50%,#120e06 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"Georgia,serif", padding:"24px 20px", overflowY:"auto" }}>
      <style>{`@keyframes floatUp{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}textarea:focus{outline:none}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:#3a2a10;border-radius:3px}`}</style>
      <div style={{ position:"fixed", top:0, left:0, right:0, height:6, background:"linear-gradient(90deg,#2c1e0f,#8b6914,#c9a84c,#8b6914,#2c1e0f)" }}/>
      <div style={{ textAlign:"center", maxWidth:740, width:"100%" }}>
        <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:16 }}>
          {profileAnswers && profileAnswers.name ? (
            <div onClick={() => setScreen("profile")} style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:20, padding:"5px 12px", cursor:"pointer" }}>
              <span style={{ color:"#c9a84c", fontSize:12 }}>👤 {profileAnswers.name}</span>
              <span style={{ color:"#4a3a18", fontSize:10 }}>· Edit</span>
            </div>
          ) : (
            <div onClick={() => setScreen("profile")} style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(201,168,76,0.05)", border:"1px solid rgba(201,168,76,0.12)", borderRadius:20, padding:"5px 12px", cursor:"pointer" }}>
              <span style={{ color:"#6a5420", fontSize:12 }}>📜 Set up profile →</span>
            </div>
          )}
          <div onClick={() => setScreen("library")} style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(201,168,76,0.05)", border:"1px solid rgba(201,168,76,0.12)", borderRadius:20, padding:"5px 12px", cursor:"pointer" }}>
            <span style={{ color:"#6a5420", fontSize:12 }}>📚 Library</span>
          </div>
        </div>
        <div style={{ fontSize:32, marginBottom:4 }}>🎭</div>
        <h1 style={{ color:"#e8d5a3", fontSize:24, fontWeight:700, margin:"0 0 4px", textShadow:"0 2px 20px rgba(201,168,76,0.3)" }}>The Philosophical Council</h1>
        <p style={{ color:"#6a5420", fontSize:11, textTransform:"uppercase", letterSpacing:3, marginBottom:20 }}>Assemble Your Council</p>
        <div style={{ marginBottom:20 }}>
          <p style={{ color:"#8b7040", fontSize:13, marginBottom:10 }}>Choose your council <span style={{ color:"#4a3a18", fontSize:11 }}>(min 2)</span></p>
          <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:9 }}>
            {Object.entries(ALL_PHILOSOPHERS).map(([k, ph], idx) => {
              const on = selected.has(k);
              return (
                <div key={k} onClick={() => togglePh(k)} style={{ cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"9px 7px", borderRadius:12, border:"1.5px solid "+(on?ph.accent:"rgba(201,168,76,0.1)"), background:on?"rgba(30,20,8,0.9)":"rgba(10,8,4,0.5)", transition:"all 0.2s ease", boxShadow:on?"0 0 14px "+ph.accent+"33":"none", minWidth:68, position:"relative" }}>
                  {on && <div style={{ position:"absolute", top:-6, right:-6, width:17, height:17, borderRadius:"50%", background:ph.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#0e0b08", fontWeight:900 }}>✓</div>}
                  <div style={{ width:56, height:84, animation:on?"floatUp 3s ease infinite":"none", animationDelay:(idx*0.25)+"s" }}>
                    <ph.Body size={56} gesture="idle" />
                  </div>
                  <span style={{ fontSize:9, color:on?ph.accent:"#4a3a18", fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, textAlign:"center" }}>{ph.name.split(" ").slice(-1)[0]}</span>
                  <span style={{ fontSize:7.5, color:on?"#8b7040":"#2a2010", textAlign:"center", maxWidth:65, lineHeight:1.2 }}>{ph.era}</span>
                </div>
              );
            })}
          </div>
          <p style={{ color:"#4a3820", fontSize:11, marginTop:8 }}>{selected.size} selected</p>
        </div>
        <div style={{ background:"rgba(20,14,6,0.85)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:16, padding:20, boxShadow:"0 8px 32px rgba(0,0,0,0.5)" }}>
          <label style={{ display:"block", color:"#c9a84c", fontSize:13, marginBottom:7, textAlign:"left" }}>Ask anything — deep or delightfully trivial</label>
          <textarea value={problem} onChange={e => setProblem(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); startDebate(); } }}
            placeholder="Should I eat the french fries? / Should I quit my job? / What is love?" rows={3}
            style={{ width:"100%", background:"rgba(255,245,220,0.04)", border:"1px solid rgba(201,168,76,0.15)", borderRadius:10, padding:"10px 12px", fontSize:14, fontFamily:"Georgia,serif", color:"#e8d5a3", resize:"none", boxSizing:"border-box", outline:"none" }} />
          {problem.trim() && (
            <div style={{ display:"flex", alignItems:"center", gap:6, margin:"5px 0 3px" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:classifyQuestion(problem)==="light"?"#7ec8a0":"#9b59b6" }}/>
              <span style={{ fontSize:11, color:classifyQuestion(problem)==="light"?"#5a9870":"#7a4a9a" }}>
                {classifyQuestion(problem)==="light" ? "Light mode — they'll be playful" : "Deep mode — they'll go to the bone"}
              </span>
            </div>
          )}
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, margin:"7px 0 10px" }}>
            {examples.map((ex, i) => (
              <button key={i} onClick={() => setProblem(ex.text)} style={{ fontSize:11, padding:"3px 8px", borderRadius:20, border:"1px solid "+(ex.tone==="light"?"rgba(126,200,160,0.2)":"rgba(201,168,76,0.15)"), background:ex.tone==="light"?"rgba(126,200,160,0.06)":"rgba(201,168,76,0.04)", cursor:"pointer", color:ex.tone==="light"?"#5a9870":"#7a6030" }}>
                {ex.tone==="light"?"☀️ ":"🌙 "}{ex.text.slice(0,30)}…
              </button>
            ))}
          </div>
          {debateError && (
            <div style={{ margin:"8px 0 4px", padding:"10px 14px", borderRadius:10, background:"rgba(180,60,40,0.12)", border:"1px solid rgba(180,60,40,0.3)", color:"#e08070", fontSize:12, lineHeight:1.6 }}>
              ⚠️ {debateError}
            </div>
          )}
          <button onClick={startDebate} disabled={!problem.trim()||isLoading||selected.size<2}
            style={{ width:"100%", padding:"11px", borderRadius:10, border:"none", background:(!problem.trim()||isLoading||selected.size<2)?"#1e1408":"linear-gradient(135deg,#5a3a08,#c9a84c,#8b6914)", color:(!problem.trim()||isLoading||selected.size<2)?"#3a2a10":"#1a1008", fontSize:14, fontWeight:700, cursor:(!problem.trim()||isLoading||selected.size<2)?"not-allowed":"pointer" }}>
            {isLoading ? "Summoning the council…" : "Open the Debate →"}
          </button>
        </div>
      </div>
      <div style={{ position:"fixed", bottom:0, left:0, right:0, height:6, background:"linear-gradient(90deg,#2c1e0f,#8b6914,#c9a84c,#8b6914,#2c1e0f)" }}/>
    </div>
  );

  // ── DEBATE ──
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#0e0b08 0%,#1a1208 60%,#120e06 100%)", fontFamily:"Georgia,serif", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}@keyframes bobAnim{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}@keyframes pulseAnim{0%,100%{opacity:1}50%{opacity:0.6}}@keyframes flickerAnim{0%,100%{opacity:1}93%{opacity:0.7}94%{opacity:1}97%{opacity:0.85}98%{opacity:1}}textarea:focus{outline:none}`}</style>
      <div style={{ position:"fixed", top:0, left:0, right:0, height:6, background:"linear-gradient(90deg,#2c1e0f,#8b6914,#c9a84c,#8b6914,#2c1e0f)", zIndex:10 }}/>
      <div style={{ position:"fixed", top:6, left:0, width:32, bottom:6, background:"linear-gradient(180deg,#1e1206,#0e0804)", borderRight:"1px solid rgba(201,168,76,0.12)", zIndex:10 }}/>
      <div style={{ position:"fixed", top:6, right:0, width:32, bottom:6, background:"linear-gradient(180deg,#1e1206,#0e0804)", borderLeft:"1px solid rgba(201,168,76,0.12)", zIndex:10 }}/>

      <div style={{ textAlign:"center", padding:"10px 48px 4px", zIndex:5, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ width:60 }} />
        <div style={{ flex:1, textAlign:"center" }}>
          <div style={{ color:"#6a5420", fontSize:10, textTransform:"uppercase", letterSpacing:3 }}>The Philosophical Council</div>
          <div style={{ color:"rgba(201,168,76,0.35)", fontSize:11, marginTop:2, fontStyle:"italic", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:400, margin:"2px auto 0" }}>"{submitted}"</div>
        </div>
        <button onClick={() => {
          if (soundOn && ambienceRef.current) { ambienceRef.current.fadeOut(0.5); setTimeout(() => { try { ambienceRef.current && ambienceRef.current.stop(); } catch {} ambienceRef.current = null; }, 600); }
          setSoundOn(p => !p);
        }} style={{ width:60, background:"transparent", border:"1px solid "+(soundOn?"rgba(201,168,76,0.25)":"rgba(255,255,255,0.08)"), borderRadius:20, padding:"4px 10px", color:soundOn?"#c9a84c":"#3a2a10", fontSize:11, cursor:"pointer" }}>
          {soundOn ? "🔊 On" : "🔇 Off"}
        </button>
      </div>

      <div style={{ display:"flex", justifyContent:"center", gap:5, padding:"5px 0", zIndex:5 }}>
        {turns.map((t, i) => (
          <div key={i} onClick={() => setCurrentIdx(i)} style={{ width:i===currentIdx?18:7, height:7, borderRadius:4, background:i===currentIdx?(turns[i]&&turns[i].philosopher==="user"?"#7ec8a0":(ALL_PHILOSOPHERS[turns[i]&&turns[i].philosopher]||{}).accent||"#c9a84c"):"rgba(201,168,76,0.12)", cursor:"pointer", transition:"all 0.3s ease" }} />
        ))}
        {isLoading && <div style={{ width:7, height:7, borderRadius:4, background:"rgba(201,168,76,0.25)", animation:"pulseAnim 1s infinite" }} />}
      </div>

      <div style={{ flex:1, display:"flex", alignItems:"flex-end", justifyContent:"center", padding:"0 48px 0", position:"relative", minHeight:0 }}>
        <div style={{ position:"absolute", bottom:0, left:32, right:32, height:56, background:"linear-gradient(180deg,#1e1408,#0e0a04)", borderTop:"1px solid rgba(201,168,76,0.18)" }}/>
        {[0,1,2,3,4,5,6,7].map(i => (
          <div key={i} style={{ position:"absolute", bottom:0, left:"calc(32px + "+i*12.5+"%)", width:1, height:56, background:"rgba(201,168,76,0.03)" }} />
        ))}
        {activePh && <div style={{ position:"absolute", bottom:0, left:"50%", transform:"translateX(-50%)", width:240, height:340, background:"radial-gradient(ellipse at 50% 100%, "+activePh.accent+"18 0%, transparent 70%)", pointerEvents:"none", transition:"background 0.5s ease", animation:"flickerAnim 8s infinite" }}/>}
        {isUser && <div style={{ position:"absolute", bottom:0, left:"50%", transform:"translateX(-50%)", width:200, height:300, background:"radial-gradient(ellipse at 50% 100%, #7ec8a018 0%, transparent 70%)", pointerEvents:"none" }}/>}

        <div style={{ position:"absolute", bottom:56, left:32, right:32, display:"flex", justifyContent:"space-around", alignItems:"flex-end", zIndex:1 }}>
          {selArr.map(k => {
            const ph = ALL_PHILOSOPHERS[k];
            const ia = cur && cur.philosopher === k;
            return (
              <div key={k} style={{ opacity:ia?0:0.1, transform:"scale(0.8)", transition:"all 0.5s ease", filter:"sepia(50%) grayscale(50%)" }}>
                <ph.Body size={76} gesture="idle" />
              </div>
            );
          })}
        </div>

        {cur && !isUser && activePh && (
          <div key={currentIdx+"-"+cur.philosopher} style={{ position:"relative", zIndex:3, display:"flex", flexDirection:"column", alignItems:"center", animation:"bobAnim 2s ease infinite" }}>
            <activePh.Body size={150} gesture={gesture} />
          </div>
        )}
        {cur && isUser && (
          <div key={"user-"+currentIdx} style={{ position:"relative", zIndex:3, display:"flex", flexDirection:"column", alignItems:"center", animation:"bobAnim 2s ease infinite" }}>
            <svg width={150} height={225} viewBox="0 0 100 150" fill="none">
              <rect x="39" y="117" width="10" height="29" rx="3" fill="#2a3828"/>
              <rect x="51" y="117" width="10" height="29" rx="3" fill="#2a3828"/>
              <path d="M30 80 Q31 75 50 73 Q69 75 70 80 L72 117 Q60 121 50 119 Q40 121 28 117Z" fill="#2a3828"/>
              <path d="M36 92 Q20 100 17 118" stroke="#2a3828" strokeWidth="9" strokeLinecap="round" fill="none"/>
              <path d="M64 92 Q80 100 83 118" stroke="#2a3828" strokeWidth="9" strokeLinecap="round" fill="none"/>
              <rect x="44" y="65" width="12" height="13" rx="5" fill="#c8a870"/>
              <ellipse cx="50" cy="50" rx="22" ry="24" fill="#c8a870"/>
              <path d="M28 46 Q30 24 50 22 Q70 24 72 46 Q65 30 50 31 Q35 30 28 46Z" fill="#3a2a18"/>
              <path d="M44 65 Q50 69 56 65" stroke="#7ec8a0" strokeWidth="1.5" fill="none"/>
              <text x="50" y="138" textAnchor="middle" fill="#7ec8a0" fontSize="7" fontFamily="Georgia" fontWeight="bold">
                {profileAnswers && profileAnswers.name ? profileAnswers.name.split(" ")[0].toUpperCase() : "YOU"}
              </text>
            </svg>
          </div>
        )}
      </div>

      <div style={{ zIndex:5, padding:"0 48px 12px" }}>
        {cur && (
          <div key={"bubble-"+currentIdx} style={{ background:isUser?"linear-gradient(160deg,#1a2a1a,#121e12)":"linear-gradient(160deg,#1e1a0e,#16120a)", border:"1px solid "+(isUser?"#7ec8a044":(activePh?activePh.accent:"#c9a84c")+"44"), borderRadius:18, padding:"14px 18px", maxWidth:560, margin:"0 auto 10px", position:"relative", boxShadow:"0 4px 32px rgba(0,0,0,0.6)", animation:"slideUp 0.4s ease" }}>
            <div style={{ position:"absolute", bottom:-13, left:"50%", transform:"translateX(-50%)", width:0, height:0, borderLeft:"13px solid transparent", borderRight:"13px solid transparent", borderTop:"13px solid "+(isUser?"#1a2a1a":"#1e1a0e") }}/>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:isUser?"#7ec8a0":(activePh?activePh.accent:"#c9a84c"), boxShadow:"0 0 6px "+(isUser?"#7ec8a0":(activePh?activePh.accent:"#c9a84c")) }}/>
              <span style={{ fontWeight:700, color:isUser?"#7ec8a0":(activePh?activePh.accent:"#c9a84c"), fontSize:12, textTransform:"uppercase", letterSpacing:1 }}>
                {isUser ? (profileAnswers && profileAnswers.name ? profileAnswers.name : "You") : (activePh ? activePh.name : "")}
              </span>
              {!isUser && activePh && <span style={{ color:"#4a3a18", fontSize:10 }}>· {activePh.era}</span>}
              <span style={{ marginLeft:"auto", color:"#3a2a10", fontSize:10 }}>{currentIdx+1}/{turns.length}</span>
            </div>
            <p style={{ margin:0, lineHeight:1.85, color:isUser?"#a8d8a8":"#e8d5a3", fontSize:14, fontStyle:"italic" }}>{cur.text}</p>
          </div>
        )}

        {inputOpen && (
          <div style={{ maxWidth:560, margin:"0 auto 10px", background:"linear-gradient(160deg,#1a2a1a,#121e12)", border:"1px solid #7ec8a033", borderRadius:14, padding:"12px 14px", animation:"slideUp 0.3s ease" }}>
            <div style={{ fontSize:10, color:"#7ec8a0", textTransform:"uppercase", letterSpacing:1, marginBottom:7, fontWeight:700 }}>
              {profileAnswers && profileAnswers.name ? "Speak, "+profileAnswers.name.split(" ")[0] : "Speak to the Council"}
            </div>
            <textarea ref={speakRef} value={userInput} onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => { if (e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleUserSpeak();} if(e.key==="Escape"){setInputOpen(false);setUserInput("");} }}
              placeholder="Challenge them, ask a question, push back…" rows={2}
              style={{ width:"100%", background:"rgba(120,200,120,0.04)", border:"1px solid rgba(126,200,160,0.2)", borderRadius:8, padding:"9px 12px", fontSize:13, fontFamily:"Georgia,serif", color:"#b8d8b8", resize:"none", boxSizing:"border-box", outline:"none" }} />
            <div style={{ display:"flex", gap:6, marginTop:8, justifyContent:"flex-end" }}>
              <button onClick={() => { setInputOpen(false); setUserInput(""); }} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid rgba(201,168,76,0.15)", background:"transparent", color:"#5a4420", fontSize:11, cursor:"pointer" }}>Cancel</button>
              <button onClick={handleUserSpeak} disabled={!userInput.trim()||isLoading} style={{ padding:"6px 18px", borderRadius:8, border:"none", background:(!userInput.trim()||isLoading)?"#1a2818":"linear-gradient(135deg,#1e4a28,#7ec8a0)", color:(!userInput.trim()||isLoading)?"#3a4a38":"#0e1e12", fontSize:12, fontWeight:700, cursor:(!userInput.trim()||isLoading)?"not-allowed":"pointer" }}>Speak →</button>
            </div>
          </div>
        )}

        <div style={{ display:"flex", gap:6, justifyContent:"center", alignItems:"center", maxWidth:560, margin:"0 auto" }}>
          <button onClick={goPrev} disabled={currentIdx===0} style={{ padding:"8px 11px", borderRadius:10, border:"1px solid rgba(201,168,76,0.12)", background:currentIdx===0?"transparent":"rgba(201,168,76,0.06)", color:currentIdx===0?"#2a1a08":"#c9a84c", fontSize:12, fontWeight:600, cursor:currentIdx===0?"not-allowed":"pointer" }}>←</button>
          <button onClick={() => { setInputOpen(p => !p); setTimeout(() => speakRef.current && speakRef.current.focus(), 50); }} disabled={isLoading}
            style={{ padding:"8px 12px", borderRadius:10, border:"1px solid "+(inputOpen?"#7ec8a066":"rgba(126,200,160,0.2)"), background:inputOpen?"rgba(126,200,160,0.12)":"rgba(126,200,160,0.05)", color:isLoading?"#3a4a38":"#7ec8a0", fontSize:12, fontWeight:700, cursor:isLoading?"not-allowed":"pointer" }}>
            {inputOpen ? "✕" : "✦ Speak"}
          </button>
          <button onClick={goNext} disabled={isLoading} style={{ flex:1, maxWidth:140, padding:"10px 14px", borderRadius:10, border:"1px solid "+(activePh?activePh.accent:"#8b6914")+"33", background:isLoading?"#1a1208":"linear-gradient(135deg,#2c1e08,#8b6914)", color:isLoading?"#3a2a10":"#f0d878", fontSize:13, fontWeight:700, cursor:isLoading?"not-allowed":"pointer", boxShadow:activePh&&!isLoading?"0 4px 14px rgba(139,105,20,0.25)":"none", transition:"all 0.3s ease" }}>
            {isLoading ? "…" : currentIdx < turns.length-1 ? "Skip →" : "More →"}
          </button>
          <button onClick={goNext} disabled={isLoading||currentIdx===turns.length-1} style={{ padding:"8px 11px", borderRadius:10, border:"1px solid rgba(201,168,76,0.12)", background:currentIdx===turns.length-1?"transparent":"rgba(201,168,76,0.06)", color:currentIdx===turns.length-1?"#2a1a08":"#c9a84c", fontSize:12, fontWeight:600, cursor:(isLoading||currentIdx===turns.length-1)?"not-allowed":"pointer" }}>→</button>
          <button onClick={() => setShowJournal(true)} title="Save & reflect" style={{ padding:"8px 10px", borderRadius:10, border:"1px solid rgba(201,168,76,0.18)", background:"rgba(201,168,76,0.06)", color:"#c9a84c", fontSize:13, cursor:"pointer" }}>✍️</button>
          <button onClick={() => generateDebatePDF(submitted, turns, selArr, profileAnswers, Date.now(), null, null)} title="Download as PDF" style={{ padding:"8px 10px", borderRadius:10, border:"1px solid rgba(201,168,76,0.18)", background:"rgba(201,168,76,0.06)", color:"#c9a84c", fontSize:13, cursor:"pointer" }}>📄</button>
        </div>

        <div style={{ display:"flex", gap:6, justifyContent:"center", maxWidth:560, margin:"7px auto 0" }}>
          <button onClick={() => setScreen("profile")} style={{ flex:1, padding:"7px", borderRadius:10, border:"1px solid rgba(201,168,76,0.12)", background:"rgba(201,168,76,0.03)", color:"#6a5420", fontSize:11, cursor:"pointer" }}>📜 Profile</button>
          <button onClick={() => setScreen("library")} style={{ flex:1, padding:"7px", borderRadius:10, border:"1px solid rgba(201,168,76,0.12)", background:"rgba(201,168,76,0.03)", color:"#6a5420", fontSize:11, cursor:"pointer" }}>📚 Library</button>
          <button onClick={() => setScreen("intro")} style={{ flex:1, padding:"7px", borderRadius:10, border:"1px solid rgba(201,168,76,0.12)", background:"rgba(201,168,76,0.03)", color:"#6a5420", fontSize:11, cursor:"pointer" }}>✦ Council</button>
          <button onClick={() => { setSubmitted(""); setTurns([]); setCurrentIdx(0); setScreen("intro"); }} style={{ flex:1, padding:"7px", borderRadius:10, border:"1px solid rgba(201,168,76,0.12)", background:"rgba(201,168,76,0.03)", color:"#6a5420", fontSize:11, cursor:"pointer" }}>✦ New</button>
        </div>
      </div>

      {showJournal && <JournalModal debateProblem={submitted} debateTurns={turns} onClose={() => setShowJournal(false)} onSave={handleSaveDebate} />}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, height:6, background:"linear-gradient(90deg,#2c1e0f,#8b6914,#c9a84c,#8b6914,#2c1e0f)", zIndex:10 }}/>
    </div>
  );
}
