var Game = [];
var StartupName;
Game.Money = 0.0;
Game.VPSRatio = 0.001;
//Game.VPSRatio = 0.1;
Game.SEOAmount = 1000;
Game.Power = 500;

Game.UPGRADE_TYPES = {
  POWER : {value: 0, name: "Power"}, 			//Upgrades to the maximum power usage
  POWERPCT : {value: 1, name: "Power Percent"}, //Upgrades to the maximum power usage by increasing it by a percentage
  VPSRATIO: {value: 2, name: "VPS Ratio"}, 		//Upgrades to the VPS Ratio
  SEOAMOUNT : {value: 3, name: "SEO Amount"}	//Upgrades to the SEO Amount
};

Game.Items = [];
Game.Items[0] = {'Name':'Cheap-o Host', 'Price':4.99, 'VPS':30, 'Power':0, 'Description':'A really cheap online host. It boasts 9% uptime! Hardware specs unknown.'};
Game.Items[1] = {'Name':'Raspberry Pi', 'Price':35, 'VPS':200, 'Power':10, 'Description':'A tiny PC on a single circuit board. I/O is incredibly slow, but it works. 700Mhz processor with 512MB of RAM.'};
Game.Items[2] = {'Name':'Netbook', 'Price':100, 'VPS':450, 'Power':50, 'Description':'A cheap netbook with a 1Ghz processor and 1GB of RAM.'};
Game.Items[3] = {'Name':'Refurbished Desktop', 'Price':200, 'VPS':700, 'Power':300, 'Description':'A refurbished consumer-grade desktop PC with a 2Ghz processor and 2GB of RAM.'};
Game.Items[4] = {'Name':'Dedicated Server', 'Price':2000, 'VPS':10000, 'Power':800, 'Description':'A dedicated single-CPU server with a 2.8Ghz processor and 8GB of RAM.'};
Game.Items[5] = {'Name':'Blade Server', 'Price':30000, 'VPS':1000000, 'Power':2000, 'Description':'A rack-mounted Blade Server with two 3.2Ghz processors and 32GB of RAM.'};
Game.Items[6] = {'Name':'Amazon EC2', 'Price':250000, 'VPS':15000000, 'Power':15000, 'Description':'An Amazon EC2 instance with 4 virtual CPUs at 3.2Ghz and 64GB of RAM. Unfortunately, you have to pay the power bill too.'};
Game.Items[7] = {'Name':'The "Cloud"', 'Price':9999999, 'VPS':9999999999, 'Power':999999, 'Description':'The Cloud can do anything, for the right price.'};

Game.Upgrades = [];
Game.Upgrades[0] = {'Name':'Improved Breaker Box', 'Price':250, 'Type': Game.UPGRADE_TYPES.POWER, 'Amount':500, 'Description':'Upgrades to maximum power usage by 500 watts.', 'PwrReq':250, 'MnyReq':0, 'VPSReq':100, 'Unlocked':false, 'Purchased':false }
Game.Upgrades[1] = {'Name':'50amp Fuses', 'Price':400, 'Type': Game.UPGRADE_TYPES.POWER, 'Amount':500, 'Description':'Upgrades to maximum power usage by another 500 watts.', 'PwrReq':500, 'MnyReq':0, 'VPSReq':200, 'Unlocked':false, 'Purchased':false }
Game.Upgrades[2] = {'Name':'80amp Fuses', 'Price':1250, 'Type': Game.UPGRADE_TYPES.POWERPCT, 'Amount':0.25, 'Description':'Upgrades to maximum power usage by 25%.', 'PwrReq':501, 'MnyReq':0, 'VPSReq':200, 'Unlocked':false, 'Purchased':false }
Game.Upgrades[3] = {'Name':'Dedicated Line', 'Price':2000, 'Type': Game.UPGRADE_TYPES.POWER, 'Amount':5000, 'Description':'Upgrades to maximum power usage by 25%.', 'PwrReq':1000, 'MnyReq':0, 'VPSReq':200, 'Unlocked':false, 'Purchased':false }

Game.infrastructure = [];

$(document).ready(function() {
 	RegisterHooks();
 	$('.mainContent').hide();
 	$('#startupNameHeader').hide();

 	//Create an infrastructure element for each possible infrastructure type
 	for(var i=0; i<Game.Items.length; i++) {
 		Game.infrastructure[i] = 0;
 	}
 	$('#lblRatio').text(Game.VPSRatio);

 	//Setup tooltip settings
 	$( document).tooltip({
      track: true,
      hide: { effect: "fadeOut", duration: 0 },
      show: { effect: "fadeIn", duration: 0 }
    });
});

//Registers all control events and hooks
function RegisterHooks() {
	$('#startupName-Form').on('submit', function(e) {
		e.preventDefault();	//Prevent form from submitting
		var data = $("#startupName-Form :input").serializeArray();
		Game.StartupName = data[0].value;
		StartGame();
	});

	$('#btnSEO').click(function(e) {
		PerformSEO();
	});


}

function PerformSEO() {
	var amount = Game.SEOAmount * Game.VPSRatio;
	AddMoney(amount);
}

//Starts the game
function StartGame() {
	//Hides the form used to name the startup
	$('.nameStartupDiv').hide();
	$('#startupNameHeader').text(Game.StartupName);
	$('#startupNameHeader').show();
	$('.mainContent').show();

	CreatePurchaseEntries();
	UpdatePower();
	Run();
}

function Run() {
   setTimeout(Run,100);
   if(Game.infrastructure.length > 0) {
   		var vps = CalculateVPS();
   		var mps = vps * Game.VPSRatio;
   		var tickMoney = mps * 0.1;
   		AddMoney(tickMoney);
   		$('#lblMoney').text(commafy(Game.Money.toFixed(2)));
   		$('#lblVPS').text(commafy(vps.toFixed(0)));
   		$('#lblMPS').text(commafy(mps.toFixed(2)));
   }
   UnlockUpgrades();
}

//Checks all upgrades to see if the user meets the requirements to unlock them
//If they do, this unlocks them
function UnlockUpgrades() {
	var pwr = CalculatePowerUsed();
	var mny = Game.Money;
	var vps = CalculateVPS();
	var dirty = false;
	for(var i=0; i<Game.Upgrades.length; i++) {
		if(!Game.Upgrades[i].Unlocked) {
			//Check PwrReq, MnyReq, VPSReq
			if(pwr >= Game.Upgrades[i].PwrReq && mny >= Game.Upgrades[i].MnyReq && vps >= Game.Upgrades[i].VPSReq) {
				//Unlock this upgrade!
				Game.Upgrades[i].Unlocked = true;
				dirty = true;
			}
		}
	}
	if(dirty)
		RenderUpgrades();
}

function RenderUpgrades() {
	//Clear all existing upgrades
	$('#upgradesBox').empty();

	//Render unlocked and unpurchased upgrades
	for(var i=0; i<Game.Upgrades.length; i++) {
		if(Game.Upgrades[i].Unlocked && !Game.Upgrades[i].Purchased) {
			var appendText = "<div id='upgrade" + i + "' class='upgradeBox' title='"+CreateUpgradeTooltip(Game.Upgrades[i])+"'><label>" + Game.Upgrades[i].Name + "</label><span class='upgradePrice'>"+Game.Upgrades[i].Price+"</span</div>";
			$('#upgradesBox').append(appendText);
			RegisterUpgradeHook(i);
		}
	}
}

function RegisterUpgradeHook(i) {
	$('#upgrade'+i).click(function(e) {
		PurchaseUpgrade(i);
	});
}

function PurchaseUpgrade(i) {
	var Upgrade = Game.Upgrades[i];
	if(Upgrade.Price <= Game.Money && !Upgrade.Purchased) {
		Upgrade.Purchased = true;
		RemoveMoney(Upgrade.Price);

		if(Upgrade.Type == Game.UPGRADE_TYPES.POWER) {
			Game.Power += Upgrade.Amount;
			UpdatePower();
		} else if(Upgrade.Type == Game.UPGRADE_TYPES.POWERPCT) {
			Game.Power *= (1.0+Upgrade.Amount);
			UpdatePower();
		} else if(Upgrade.Type == Game.UPGRADE_TYPES.VPSRATIO) {

		} else if(Upgrade.Type == Game.UPGRADE_TYPES.SEOAMOUNT) {

		}
		RenderUpgrades();
	}
}

function CreateUpgradeTooltip(upgrade) {
	return upgrade.Description;
}

function CalculateVPS() {
	var total = 0.0;
	for(var i=0; i<Game.infrastructure.length; i++) {
		total += Game.infrastructure[i] * Game.Items[i].VPS;
	}
	return total;
}

function CalculatePowerUsed() {
	var total = 0.0;
	for(var i=0; i<Game.infrastructure.length; i++) {
		total += Game.infrastructure[i] * Game.Items[i].Power;
	}
	return total;
}

function CalculatePowerPercentage() {
	var used = CalculatePowerUsed();
	return used / Game.Power;
}

function AddMoney(i) {
	Game.Money += i;
}

function RemoveMoney(i) {
	Game.Money -= i;
}

//Creates all of the items available for purchase
function CreatePurchaseEntries() {
	var purchaseBox = $('#purchaseBox');
	for(var i=0; i<Game.Items.length; i++) {
		var appendText = "<div class='itemBox' title='"+CreateHardwareTooltip(Game.Items[i])+"'><label for='purchaseButton"+i+"'>" + Game.Items[i].Name + "</label><input type='Button' class='purchaseButton' id='purchaseButton"+i+"' value='$"+commafy(Game.Items[i].Price)+"' /></div>";
		$(purchaseBox).append(appendText);
		RegisterPurchaseHook(i);
	}
}

function RegisterPurchaseHook(i) {
	$('#purchaseButton'+i).click(function(e) {
		Purchase(i);
	});
}


function CreateHardwareTooltip(item) {
	//TODO: create this
	return item.Description + " [Power:" + commafy(item.Power) + "]";
}

function UpdateInfrastructure() {
	var infrastructureBox = $('#infrastructureBox');
	infrastructureBox.empty();
	for(var i=0; i<Game.infrastructure.length; i++) {
		if(Game.infrastructure[i] > 0) {
			var appendText = "<div class='itemBox'><label class='infrastructureName'>" + Game.Items[i].Name + "</label><span class='infrastructureCount'>"+Game.infrastructure[i]+"</span></div>";
			$(infrastructureBox).append(appendText);
		}
	}
	UpdatePower();
}

function UpdatePower() {
	var used = CalculatePowerUsed();
	$('#powerProgressBar').prop('title', "" + commafy(used) + " / " + commafy(Game.Power));
	$('#powerProgressLabel').text("Power: " + commafy(used) + " / " + commafy(Game.Power));
	var amount = CalculatePowerPercentage() * 100.0;
	$('#powerProgressBar').progressbar({
		value: amount
	});
}


//Flashes the power progress bar red momentarily to indicate that
//the user tried to exceed the max power available
function FlashPower() {
	var pbValue = $('#powerProgressBar').find('.ui-progressbar-value');
	pbValue.addClass('progress-flash');
	setTimeout(UnflashPower,150);
}

function UnflashPower() {
	var pbValue = $('#powerProgressBar').find('.ui-progressbar-value');
	pbValue.removeClass('progress-flash');
}

function FlashMoney() {
	var divMoney = $('#lblMoney').parent();
	divMoney.addClass('progress-flash');
	setTimeout(UnflashMoney,150);
}

function UnflashMoney() {
	var divMoney = $('#lblMoney').parent();
	divMoney.removeClass('progress-flash');
}

//Debugging function only
function log(str) {
	window.console&&console.log(str);
}

//Purchases an item, provided that the requirements are met
function Purchase(i) {
	var item = Game.Items[i];
	if(item.Price <= Game.Money) {
		if(CalculatePowerUsed() + item.Power > Game.Power) {
			//Buying this would exceed the available power
			FlashPower();
			return;
		}
		RemoveMoney(item.Price);
		Game.infrastructure[i]++;
		UpdateInfrastructure();
	} else {
		FlashMoney();
		return;
	}
}

//Regex goodness to add commas to a number
function commafy(num) {
  var parts = num.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}
