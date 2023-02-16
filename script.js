

const canvas = document.querySelector('canvas');
const drawContext = canvas.getContext('2d');

var spect_pos = {w: 1600, h: 700, w_margin: 50, h_margin: 80};
var spect_view  = {center_note: 69, cents_span: 200, db_max: 0, db_min: -160, freq_A4: 442};

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

canvas.addEventListener('click', mouseClickedEvent, false);

navigator.mediaDevices.getUserMedia({
  audio: true,
  video: false
}).then(stream => {
  const audioContext = new AudioContext({sampleRate: 11025});
  const sourceNode = audioContext.createMediaStreamSource(stream);
  const analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 32768;
  sourceNode.connect(analyserNode);

  console.log("sampleRate", audioContext.sampleRate);

  function draw() {

    const timeseries = new Float32Array(analyserNode.fftSize);
    const spectrum = new Float32Array(analyserNode.fftSize);
    analyserNode.getFloatTimeDomainData(timeseries);
    analyserNode.getFloatFrequencyData(spectrum);

    // Background
    drawContext.fillStyle = 'rgba(50, 50, 50, 1)';
    drawContext.fillRect(0, 0, canvas.width, canvas.height);

    // 画面サイズに合わせて描画領域を更新
    spect_pos.x = spect_pos.w_margin;
    spect_pos.y = spect_pos.h_margin;
    spect_pos.w = canvas.width - spect_pos.w_margin*2;
    spect_pos.h = canvas.height - spect_pos.h_margin*2;

    // グラフ領域
    drawContext.fillStyle = 'rgba(0, 0, 0, 1)';
    drawContext.fillRect(spect_pos.x, spect_pos.y, spect_pos.w, spect_pos.h);

    cents_min = Math.ceil(spect_view.center_note*10 - spect_view.cents_span/2/10) * 10;
    cents_max = Math.floor(spect_view.center_note*10 + spect_view.cents_span/2/10) * 10;
    note_min = Math.ceil(spect_view.center_note - spect_view.cents_span/2/100);
    note_max = Math.floor(spect_view.center_note + spect_view.cents_span/2/100);
    // Small Grid
    if(spect_view.cents_span <= 5000)
    {
      drawContext.beginPath();
      for(let i = cents_min; i <= cents_max; i=i+10)
      {
        x = (i - spect_view.center_note*100) / spect_view.cents_span * spect_pos.w;
        drawContext.moveTo(x + spect_pos.w/2 + spect_pos.x, spect_pos.y);
        drawContext.lineTo(x + spect_pos.w/2 + spect_pos.x, spect_pos.y + spect_pos.h);
      }
      drawContext.strokeStyle = 'rgba(20, 20, 20, 1)';
      drawContext.lineWidth = 2;
      drawContext.stroke();
    }

    // Main Grid
    drawContext.beginPath();
    for(let i = note_min; i <= note_max; i++)
    {
      x = (i - spect_view.center_note) * 100 / spect_view.cents_span * spect_pos.w;
      drawContext.moveTo(x + spect_pos.w/2 + spect_pos.x, spect_pos.y);
      drawContext.lineTo(x + spect_pos.w/2 + spect_pos.x, spect_pos.y + spect_pos.h);
      // Draw key name
      keynames = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
      center_key_name = keynames[i % 12] + Math.floor(i/12 - 1);
      drawContext.font = '30px sans-serif';
      drawContext.textAlign = 'center';
      drawContext.fillStyle = 'white';
      drawContext.fillText(center_key_name, x + spect_pos.w/2 + spect_pos.x, spect_pos.y - 30);
    }
    drawContext.strokeStyle = 'rgba(50, 50, 50, 1)';
    drawContext.lineWidth = 2;
    drawContext.stroke();

    // Draw cents
    if(spect_view.cents_span <= 200)
    {
      for(let i = cents_min; i <= cents_max; i=i+10)
      {
        x = (i - spect_view.center_note*100) / spect_view.cents_span * spect_pos.w;
        // Draw key name
        cents_str = (i - spect_view.center_note*100).toString();
        if(i - spect_view.center_note*100 >= 0) cents_str = '+' + cents_str;
        drawContext.font = '15px sans-serif';
        drawContext.textAlign = 'center';
        drawContext.fillStyle = 'white';
        drawContext.fillText(cents_str, x + spect_pos.w/2 + spect_pos.x, spect_pos.y - 5);
      }
    }

    drawContext.beginPath();
    drawContext.moveTo(spect_pos.x + spect_pos.w/2, spect_pos.y);
    drawContext.lineTo(spect_pos.x + spect_pos.w/2, spect_pos.y + spect_pos.h);
    drawContext.strokeStyle = 'rgba(100, 50, 50, 1)';
    drawContext.lineWidth = 2;
    drawContext.stroke();
    
    // Draw spectrum
    drawContext.beginPath();
    drawContext.moveTo(spect_pos.x, spect_pos.y + spect_pos.h/2);
    for (let i = 0; i < analyserNode.fftSize; ++i) {
      if(i < analyserNode.fftSize/2)
      {
        f = i * audioContext.sampleRate / analyserNode.fftSize;
        cf = spect_view.freq_A4 * Math.pow(2.0, (spect_view.center_note-69)/12);
        cents = 1200 * Math.log2(f / cf);
        x = cents / spect_view.cents_span * spect_pos.w;
        y = (spectrum[i] - spect_view.db_max) / (spect_view.db_max - spect_view.db_min) * spect_pos.h;
        if(Math.abs(x) < spect_pos.w/2 && y > -spect_pos.h && y <= 0)
        {
          drawContext.fillStyle = 'white';
          drawContext.fillRect(x + spect_pos.w/2 + spect_pos.x, spect_pos.y - y, 2, spect_pos.h + y);
        }
      }
      drawContext.lineTo(i * spect_pos.w / analyserNode.fftSize + spect_pos.x, spect_pos.h/2 + spect_pos.y - timeseries[i]*spect_pos.h/2);
    }

    fs_str = 'Sampling = ' + audioContext.sampleRate.toString() + ' Hz';
    drawContext.font = '20px sans-serif';
    drawContext.textAlign = 'left';
    drawContext.fillStyle = 'white';
    drawContext.fillText(fs_str, spect_pos.x, spect_pos.y + spect_pos.h + 40);
    
    span_str = 'SPAN = ' + spect_view.cents_span.toString() + ' cents';
    drawContext.font = '20px sans-serif';
    drawContext.textAlign = 'center';
    drawContext.fillStyle = 'white';
    drawContext.fillText(span_str, spect_pos.w/2 + spect_pos.x, spect_pos.y + spect_pos.h + 40);
    
    span_str = 'A4 = ' + spect_view.freq_A4.toString() + ' Hz';
    drawContext.font = '20px sans-serif';
    drawContext.textAlign = 'right';
    drawContext.fillStyle = 'white';
    drawContext.fillText(span_str, spect_pos.w + spect_pos.x, spect_pos.y + spect_pos.h + 40);

    drawContext.strokeStyle = 'lime';
    drawContext.lineWidth = 0.2;
    drawContext.stroke();

    requestAnimationFrame(draw);
  }

  draw();
});


window.addEventListener('resize', function(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
})


function getMousePosition(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

function mouseClickedEvent(evt) {
  mouse_pos = getMousePosition(canvas, evt);
  if(mouse_pos.x < canvas.width / 2)
  {
    spect_view.center_note += -1;
  }
  else
  {
    spect_view.center_note += +1;
  }
}

window.onmousewheel = mouseZoom;


function mouseZoom(event) {
	if(event.wheelDelta > 0){
    if(spect_view.cents_span > 10)
    {
      spect_view.cents_span /= 2;
    }
	}else{
    spect_view.cents_span *= 2;
	}
}