var app = new Vue({
	el: '#app',
	data: {
		simple: true,
		file: {
			bankname: "",
			aba: "",
			batches: [
			{
				sec: "ppd",
				companyname: "",
				companytin: "",
				effectivedate: "",
				description: "",
				discretionary: "",
				descriptivedate: "",
				entries: [
					{
						name: "",
						routing: "",
						account: "",
						type: "dda",
						amount: 0,
						creditdebit: "cr",
						individualID: "",
						discretionary: ""
					}
				]
			}
		]
	},
	currentBatch: 0
	},
	methods: {
		addEntryToCurrentBatch: function() {
			this.file.batches[this.currentBatch].entries.push(
				{
					name: "",
					routing: "",
					account: "",
					type: "dda",
					amount: 0,
					creditdebit: "cr",
					individualID: "",
					discretionary: ""
				}
			);
		},
		deleteEntry: function(index) {
			this.file.batches[this.currentBatch].entries.splice(index, 1);
		},
		createNACHAFile: function () {
			if(this.totalCredits!==this.totalDebits) {
				alert("File not in balance.");
				return;
			}
			if(this.file.batches[0].effectivedate.length!==10) {
				alert("Date format incorrect. It must be in MM/DD/YYYY format including leading zeroes and slashes");
				return;
			}
			
			//don't forget to validate the actual input and ensure it's not TOO long (or just incorrect)
			var entryNumber = 0;
			var batchEntryNumber = 0;
			var batchEntryHash = 0;
			var fileEntryHash = 0;
			var batchDebitAmount = 0;
			var batchCreditAmount = 0;
			var fileDebitAmount = 0;
			var fileCreditAmount = 0;
			let today = new Date().toISOString();
			let twoDigitYear = String(today).substr(2,2);
			let month = String(today).substr(5,2);
			let date = String(today).substr(8,2);
			let hour = String(today).substr(11,2);
			let minute = String(today).substr(14,2);
			var fileString = "101 " + this.file.aba + " " + this.file.batches[0].companytin + twoDigitYear + month + date + hour + minute + "A094101" + this.file.bankname.toUpperCase().padEnd(23, " ") + this.file.batches[0].companyname.toUpperCase().padEnd(31, " ") + "\r\n";
			for(let i=0; i<this.file.batches.length; i++) {
				// need to fix this for unbalanced files
				batchEntryNumber = 0;
				batchEntryHash = 0;
				batchDebitAmount = 0;
				batchCreditAmount = 0;
				let d = String(this.file.batches[i].effectivedate);
				let effectiveEntryDate = d.substr(8,2) + d.substr(0,2) + d.substr(3,2);
				let batchHeader = "5200" + this.file.batches[i].companyname.toUpperCase().padEnd(16, " ") + this.file.batches[i].discretionary.toUpperCase().padEnd(20, " ") + " " + this.file.batches[i].companytin + this.file.batches[i].sec.toUpperCase() + this.file.batches[i].description.padEnd(10, " ") + this.file.batches[i].descriptivedate.padEnd(6, " ") + effectiveEntryDate + "   1" + this.file.aba.substr(0,8) + String(i+1).padStart(7, "0") + "\r\n";
				fileString += batchHeader;
				for(let j=0; j<this.file.batches[i].entries.length; j++) {
					let trancode1, trancode2;
					let amount = cleanedAmount(this.file.batches[i].entries[j].amount);
					let indname = this.file.batches[i].entries[j].name.substr(0,22);
					switch(this.file.batches[i].entries[j].type) {
						case "dda":
							trancode1 = "2";
							break;
						case "sav":
							trancode1 = "3";
							break;
					}
					switch(this.file.batches[i].entries[j].creditdebit) {
						case "cr":
							trancode2 = "2";
							batchCreditAmount += amount;
							fileCreditAmount += amount;
							break;
						case "db":
							trancode2 = "7";
							batchDebitAmount += amount;
							fileDebitAmount += amount;
							break;
					}
					//ppd
					let entryString = "6" + trancode1 + trancode2 + this.file.batches[i].entries[j].routing + this.file.batches[i].entries[j].account.padEnd(17, " ") + String(amount).padStart(10, "0") + this.file.batches[i].entries[j].individualID.padEnd(15, " ") + indname.padEnd(22, " ") + this.file.batches[i].entries[j].discretionary.padEnd(2, " ") + "0" + this.file.aba.substr(0,8) + entryNumber.toString().padStart(7, "0") + "\r\n";


					entryNumber++;
					batchEntryNumber++;
					batchEntryHash += Number(this.file.batches[i].entries[j].routing.substr(0,8));
					fileEntryHash += Number(this.file.batches[i].entries[j].routing.substr(0,8));
					fileString += entryString;
				}
				batchEntryHash = String(batchEntryHash);
				if(batchEntryHash.length>10) {
					batchEntryHash = batchEntryHash.splice(-10);
				} else {
					batchEntryHash = batchEntryHash.padStart(10, "0");
				}
				//batch control goes here
				let batchControl = "8200" + batchEntryNumber.toString().padStart(6, "0") + batchEntryHash + batchDebitAmount.toString().padStart(12, "0") + batchCreditAmount.toString().padStart(12, "0") + " " + this.file.batches[i].companytin + "".padEnd(25, " ") + this.file.aba.substr(0,8) + String(i+1).padStart(7, "0") + "\r\n";
				fileString += batchControl;
			}
			//file control goes here
			fileEntryHash = String(fileEntryHash);
			if(fileEntryHash.length>10) {
				fileEntryHash = fileEntryHash.splice(-10);
			} else {
				fileEntryHash = fileEntryHash.padStart(10, "0");
			}
			let lines = (fileString.match(/\r\n/g) || '').length + 1;
			let fileControl = "9" + this.file.batches.length.toString().padStart(6, "0") + Math.ceil(lines/10).toString().padStart(6, "0") + entryNumber.toString().padStart(8, "0") + fileEntryHash + fileDebitAmount.toString().padStart(12, "0") + fileCreditAmount.toString().padStart(12, "0") + "".padStart(39, " ") + "\r\n";
			fileString += fileControl;
			var nineFill = "".padEnd(94, "9");
			nineFill += "\r\n";
			for(let h=1; h<lines%10; h++) {
				fileString += nineFill;
			}
			download("NACHA_file.txt", fileString);
		}
	},
	computed: {
		totalCredits: function() {
			let credits = 0;
			for(let i=0; i<this.file.batches.length; i++) {
				for(let j=0; j<this.file.batches[i].entries.length; j++) {
					if(this.file.batches[i].entries[j].creditdebit==="cr") {
						credits += Number(this.file.batches[i].entries[j].amount);
						credits = Number(credits.toFixed(2));
					}
				}
			}
			return credits;
		},
		totalDebits: function() {
			let debits = 0;
			for(let i=0; i<this.file.batches.length; i++) {
				for(let j=0; j<this.file.batches[i].entries.length; j++) {
					if(this.file.batches[i].entries[j].creditdebit==="db") {
						debits += Number(this.file.batches[i].entries[j].amount);
						debits = Number(debits.toFixed(2));
					}
				}
			}
			return debits;
		}
	}

});

function cleanedAmount(num) {
	num = num.replace(/\$/g, ""); //remove "$"
	num = num.replace(/,/g, ""); //remove ","
	if (/\d*\.\d{2}$/.test(num)) { //number includes decimal point and two numbers following
		num = num.replace(/\./g, "");
	} else if (/\d*\.\.d$/.test(num)) { //number includes decimal point and one number following
		num = num.replace(/\./g, "");
		num += "0";
	} else if (/^\d*[^\.]\d*$/.test(num)) { //no decimal point
		num += "00";
	}
	num = Number(num); //now num is an integer and won't have problems.
	return num;
}