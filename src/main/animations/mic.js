import _ from 'lodash'
import mic from 'mic'
import chroma from 'chroma-js'

function wrap(x, m) {
  return ((x % m) + m) % m
}

// Gilián Zoltán <gilian@caesar.elte.hu>, 2014
// Simplified BSD License

// Járai Antal: Bevezetés a matematikába című jegyzet alapján készült.
// Harmadik kiadás, ELTE Eötvös Kiadó, 2009, 332-334 p.,
// 9.2.44. FFT algoritmus.

// based on the discrete mathematics textbook 'Bevezetés a matematikába' by
// Antal Járai (hungarian).

var sin = Math.sin,
    cos = Math.cos,
    pi2 = Math.PI * 2,
    log2 = Math.log(2);

function ReverseBits(x, nbits) {
	var y = 0;
	for (var j = 0; j < nbits; ++j) {
		y <<= 1;
		y |= (x & 1);
		x >>= 1;
	}
	return y;
}

var FFTAlgorithm = function(num_bins) {
	this.Reset(num_bins);
}

FFTAlgorithm.prototype.CreateBitRevLUT = function() {
	this.bit_rev = new Int32Array(this.num_bins);
	for (var i = 0; i < this.num_bins; ++i) {
		this.bit_rev[i] = ReverseBits(i, this.num_bits);
	}
}

FFTAlgorithm.prototype.CreateRootOfUnityLUT = function() {
	var n = this.num_bins;
	this.rou = new Float32Array(n);
	for (var i = 0; i < (n >> 1); ++i) {
		var j = ReverseBits(i, this.num_bits - 1);
		this.rou[j << 1] = cos(pi2 * i / n);
		this.rou[j << 1 | 1] = -sin(pi2 * i / n);
	}
}

FFTAlgorithm.prototype.Reset = function(num_bins) {
	this.num_bits = Math.ceil(Math.log(num_bins) / log2),
	this.num_bins = 1 << this.num_bits;
	this.buffer = new Float32Array(2 * this.num_bins);
	this.CreateBitRevLUT();
	this.CreateRootOfUnityLUT();
}

FFTAlgorithm.prototype.Forward = function(array) {
	var n = this.num_bins;
	if (array.length != 2 * n) {
		throw 'FFTAlgorithm.Forward: array size should be ' + (2 * n).toString();
	}

	for (var l = this.num_bins >> 1; l > 0; l >>= 1) {
		for (var k = 0, t = 0; k < n; k += l + l, ++t) {
			var wr = this.rou[t << 1];
			var wi = this.rou[t << 1 | 1];
			for (var j = k; j < k + l; ++j) {
				var xr = array[j << 1];
				var xi = array[j << 1 | 1];
				var zr = array[(j + l) << 1];
				var zi = array[(j + l) << 1 | 1];
				var yr = wr * zr - wi * zi;
				var yi = wr * zi + wi * zr;
				array[j << 1] = xr + yr;
				array[j << 1 | 1] = xi + yi;
				array[(j + l) << 1] = xr - yr;
				array[(j + l) << 1 | 1] = xi - yi;
			}
		}
	}

	for (var i = 0; i < n; ++i) {
		var j = this.bit_rev[i];
		if (i < j) {
			var tr = array[i << 1];
			var ti = array[i << 1 | 1];
			array[i << 1] = array[j << 1];
			array[i << 1 | 1] = array[j << 1 | 1];
			array[j << 1] = tr;
			array[j << 1 | 1] = ti;
		}
	}
}


const controller = {
	ref_level: 1e-4,
	db_min: -70,
	db_range: 70,
	freq_min_cents: 4*1200, // relative to C0
	freq_range_cents: 3*1200, // 3 octaves
	block_size: 1024,
	blocks_per_fft: 8,
}

const fft = new FFTAlgorithm(controller.block_size * controller.blocks_per_fft)

var log2 = Math.log(2);
var log10 = Math.log(10);

export default (table, next) => {
  const micInstance = mic({
    rate: '44100',
    // channels: '1',
    // debug: false,
    // exitOnSilence: 6
  })
  let data

  let micInput = micInstance.getAudioStream()
  micInput.on('data', d => data = d)

  micInstance.start()

  const leds = new Array(table.ledsPerStrip).fill(0)
  let base = 0

  return () => {
    if (!data) return

    table.setAll(chroma('black'))

    const num_samples = data.length
    const samples = new Float32Array(2 * num_samples)

    for (var i = 0; i < num_samples; ++i) {
      samples[2*i+0] = (data[i] - 127.5) / 255;  // real
      samples[2*i+1] = 0;                     // imag
    }

    // apply window

    // var fft_size = controller.block_size * controller.blocks_per_fft;
    // for (var i = 0; i < num_samples; ++i) {
    //   var x = 2 * Math.PI * i / (fft_size - 1);
    //   // Hamming window
    //   var w = 0.54 - 0.46 * Math.cos(x);

    //   // Nuttall window
    //   //w = 0.355768 - 0.487396 * Math.cos(x) + 0.144232 * Math.cos(2*x) + 0.012604 * Math.cos(3*x);
      
    //   samples[2*i+0] *= w;  // real
    //   samples[2*i+1] *= w;  // imag
    // }

    // FFT

    fft.Forward(samples);
    
    const mappedSamples = _.chunk(samples, 2).map(([ r, i ]) => Math.sqrt(r * r + i * i)).slice(0, samples.length / 4)
    const dropped = mappedSamples // _.take(_.drop(mappedSamples, samples.length / 8), samples.length / 4)
    const condensed = _.chunk(dropped, dropped.length / table.ledsPerStrip).map(_.mean)

    for (let x = 0; x < table.ledsPerStrip; x++) {
      const maxY = Math.min((Math.max(Math.log(condensed[x]) - 3, 0) / 1) * table.numStrips, table.numStrips)
      leds[x] = Math.max(maxY, leds[x] * 0.7)
    }

    base++

    for (let x = 0; x < table.ledsPerStrip; x++) {
      const maxY = leds[x]
      for (let y = 0; y < Math.round(maxY); y++) {
        const h = wrap(base + ((x / table.ledsPerStrip) * 360), 360)
        table.set(x, y, chroma.mix(chroma.hsl(h, 1, 0.1), chroma.hsl(h, 1, 0.5), y / (table.numStrips - 1)))
      }
    }

    // var sampleRate = 44100
    // var freq_res = sampleRate / num_samples;
    // var freq_nyquist = sampleRate / 2;

    // var c0_freq = 16.35;
    // var c0_cents = 1200 * Math.log(c0_freq) / log2;
    // var freq_cent = Math.pow(2, 1/1200);
    // var freq_min = c0_freq * Math.pow(freq_cent, controller.freq_min_cents);
    // var freq_max = c0_freq * Math.pow(freq_cent, controller.freq_min_cents + controller.freq_range_cents);

    // var freq_step = Math.pow(freq_cent, 10);
    // for (var freq = freq_min, i = 0; freq < Math.min(freq_max, freq_nyquist); freq *= freq_step, i++) {
    //   var bin = Math.floor(freq / freq_res)
    //   var re = samples[bin << 1];
    //   var im = samples[bin << 1 | 1];
    //   var fftMagSq = Math.pow(re / num_samples, 2) + Math.pow(im / num_samples, 2);
    //   var x = (i * 10 / controller.freq_range_cents) * (table.ledsPerStrip - 1);
    //   var db = 20 * Math.log(fftMagSq / controller.ref_level) / log10;
    //   if (db < controller.db_min) db = controller.db_min;
    //   var y = (1 - (db - controller.db_min) / controller.db_range) * (table.numStrips - 1);

    //   console.log()

    //   for (let yi = 0; yi < y; yi++) {
    //     table.set(Math.round(x), Math.round(yi), chroma('white'))
    //   }

      // if (freq == freq_min) {
      //   ctx.moveTo(x, y);
      // } else {
      //   ctx.lineTo(x, y);
      // }
    // }
    

    data = null
  }
}