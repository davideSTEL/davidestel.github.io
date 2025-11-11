
			const canvas = document.getElementById('previewCanvas');
			const ctx = canvas.getContext('2d');
			const slider = document.getElementById('scaleSlider');
			const bgColorPicker = document.getElementById('bgColorPicker');
			let img = new Image();
			let imgLoaded = false;
			let offsetX = 0, offsetY = 0;
			let isDragging = false;
			let startX, startY;
			let scale = 1;
	
			function updateCanvas() {
				ctx.fillStyle = bgColorPicker.value;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				if (imgLoaded) {
					scale = Math.min(canvas.width / img.width, canvas.height / img.height) * slider.value;
					let newWidth = img.width * scale;
					let newHeight = img.height * scale;
					ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);
				}
			}
	
			document.getElementById('fileInput').addEventListener('change', function(event) {
				const file = event.target.files[0];
				if (!file) return;
				
				const reader = new FileReader();
				reader.onload = function(e) {
					img = new Image();
					img.onload = function() {
						imgLoaded = true;
						scale = Math.min(canvas.width / img.width, canvas.height / img.height);
						offsetX = (canvas.width - img.width * scale) / 2;
						offsetY = (canvas.height - img.height * scale) / 2;
						updateCanvas();
					};
					img.src = e.target.result;
				};
				reader.readAsDataURL(file);
			});
	
			canvas.addEventListener('mousedown', function(event) {
				isDragging = true;
				startX = event.offsetX - offsetX;
				startY = event.offsetY - offsetY;
			});
	
			canvas.addEventListener('mousemove', function(event) {
				if (isDragging) {
					offsetX = event.offsetX - startX;
					offsetY = event.offsetY - startY;
					updateCanvas();
				}
			});
	
			canvas.addEventListener('mouseup', function() {
				isDragging = false;
			});
	
			canvas.addEventListener('mouseleave', function() {
				isDragging = false;
			});
	
	
		function convertToRGB565() {
			const width = canvas.width;
			const height = canvas.height;
			const imageData = ctx.getImageData(0, 0, width, height);
			const pixels = imageData.data;
	
			// Creazione buffer con 4096 byte di header + bitmap
			const headerSize = 4096;
			const buffer = new ArrayBuffer(headerSize + width * height * 2);
			const view = new DataView(buffer);
	
			// Inizializza l'header con tutti i byte a 0x00
			for (let i = 0; i < headerSize; i++) {
				view.setUint8(i, 0x00);
			}
	
			// Scrive la stringa ".sif" nei primi 4 byte dell'header
			const signature = ".sif";
			for (let i = 0; i < signature.length; i++) {
				view.setUint8(i, signature.charCodeAt(i));
			}
	
			// Personalizza altri byte dell'header
			view.setUint8(6, 0x01); // Versione del file: 1
			//view.setUint16(12, 0xABCD, true); // Esempio: 2 byte a 0xABCD (little-endian)
	
			// Calcola il checksum dei primi 15 byte e lo memorizza nel byte 15 (sedicesimo byte)
			let checksum = 0;
			for (let i = 0; i < 15; i++) {
				checksum += view.getUint8(i);
			}
			view.setUint8(15, checksum & 0xFF); // Somma modulo 256
	
			// Conversione dei pixel in RGB565 con rotazione di 180°
			let index = headerSize;
			for (let y = height - 1; y >= 0; y--) {  // Scansione dall'ultima riga alla prima (180° rotazione)
				for (let x = width - 1; x >= 0; x--) {  // Scansione da destra a sinistra
					let i = (y * width + x) * 4;
					let r = pixels[i] >> 3;    // 5 bit
					let g = pixels[i + 1] >> 2; // 6 bit
					let b = pixels[i + 2] >> 3; // 5 bit
					let rgb565 = (r << 11) | (g << 5) | b;
					view.setUint16(index, rgb565, true); // Little-endian
					index += 2;
				}
			}
	
			// Creazione del file binario
			const blob = new Blob([buffer], { type: "application/octet-stream" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = "screensaver.sif";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}
