var IsEmpty = function(obj){
	return (obj == null || obj == "")
}

function LoadDOM(file){
   var dom;
   try {
     dom = MakeDOM(null);
     dom.load(file);
   }
   catch (e) {
		WScript.Echo("XML DOM ERROR : " + e.description);
   }
   return dom;
}

function MakeDOM(progID){
  if (progID == null) {
    progID = "msxml2.DOMDocument.3.0";
  }

  var dom;
  try {
    dom = new ActiveXObject(progID);
    dom.async = false;
    dom.validateOnParse = true;
    dom.resolveExternals = false;
  }
  catch (e) {
    WScript.Echo("XML DOM ERROR : " + e.description);
  }
  return dom;
}

var SoftwareAuditor = function(outputPath){

	this.scriptname = WScript.ScriptName
	this.scriptfullpath = WScript.ScriptFullName
	this.scriptpath = this.scriptfullpath.substr(0,this.scriptfullpath.indexOf(this.scriptname))

	this.AppName = "WSH Software Auditor"
	this.FSO = new ActiveXObject("Scripting.FileSystemObject");
	this.host = WScript.CreateObject("WScript.Network").ComputerName
	var d = new Date();
	this.unique_indent = this.host+"-["+d.getYear()+(d.getMonth()+1)+d.getDate()+"-"+d.getHours()+d.getMinutes()+d.getSeconds()+"]"
	this.outputPath = (outputPath ? outputPath : this.scriptpath) + "\\" + this.host
	
	if (!this.FSO.FolderExists(this.outputPath)){
		WScript.Echo(this.outputPath)
		this.FSO.CreateFolder(this.outputPath)
	}

	this.LOGFILE_PATH = this.FSO.BuildPath(this.outputPath, this.unique_indent+"_log.txt")
	this.REPORTFILE_PATH = this.FSO.BuildPath(this.outputPath, this.unique_indent+"_report")
	this.REPORTFILE = null
	this.XSLTEMPLATE_PATH = this.FSO.BuildPath(this.outputPath, "..\\template.xsl")
	this.verbose_logging = true
	this.availableWMIObjects = {
		"Win32_ApplicationService" : {
			title		: "Installed Applications",
			id			:	"ApplicationService",
			fields	: ["Caption", "CreationClassName", "Description", "InstallDate", "Name", "Started", "StartMode", "Status", "SystemCreationClassName", "SystemName"]
		},
		"Win32_OperatingSystem"	:{
			title		: "Operating System",
			id			:	"OperatingSystem",
			fields	: ["Caption", "Version"] 
		},
		"Win32_SoftwareFeature" : {
			title		: "Software Features",
			id			:	"SoftwareFeatures",
			fields	: ["Name", "ProductName", "Version", "IdentifyingNumber", "LastUse", "Accesses" ]
		},
		"Win32_CodecFile" : {
			title		: "Codecs",
			id			:	"CodecFile",
			fields	: ["Name", "Version", "CreationDate"]
		},
		"Win32_ApplicationService" : {
			title		: "services",
			id			:	"ApplicationService",
			fields	: ["Name", "StartMode"]
		},
		"Win32_ClassInfoAction" : {
			title		: "COM Class Information",
			id			:	"ClassInfoAction",
			fields	: ["ActionID", "AppID", "Argument", "Caption", "CLSID", "Name", "ProgID", "Version"]
		},
		"Win32_Patch" : {
			title		: "File Patches",
			id			:	"Patch",
			fields	:	["Attributes", "Caption", "Description", "File", "PatchSize", "ProductCode", "Sequence", "SettingID" ]
		},
		"Win32_Product" : {
			title		: "Products installe by Windows Installer",
			id			:	"Product",
			fields	: ["Caption", "Description", "IdentifyingNumber", 'InstallDate', "InstallLocation", "InstallState", "Name", "PackageCache", "SKUNumber", "Vendor", "Version"]
		}
	}

	this.report = function(){
		this.host_wmi = GetObject("winmgmts:\\\\" + this.host + "\\root\\cimv2")
		this.logline("Using output files \n\t" + this.LOGFILE_PATH + "\n\t" + this.REPORTFILE_PATH)
		if(!this.host_wmi){ return false }
		this.createReport(["Win32_OperatingSystem", "Win32_ApplicationService", "Win32_ClassInfoAction"])
	}
	this.writeReport = function(str){
		this.REPORTFILE = this.FSO.OpenTextFile(this.REPORTFILE_PATH+".html",2,1)
		this.REPORTFILE.write(str)
		this.REPORTFILE.close()
	}
	
	this.createReport = function(objects){
		
		var xsl = LoadDOM(this.XSLTEMPLATE_PATH);
		this.logline("XSL Stylesheet Character Length : " + String(xsl.xml).length)

		var itemList
		var softwareNode
		var dom = MakeDOM(null)
		var root = dom.createElement("root")
			var meta = dom.createElement("meta")

			//REPORT TIMESTAMP
			var created = dom.createElement("created")
			var attrDate = dom.createAttribute("machine");
					attrDate.value = Date()
					created.setAttributeNode(attrDate);
			// MACHINE/HOST NAME
			var machineName = dom.createElement("machine")
			var attrName = dom.createAttribute("machine");
					attrName.value = this.host
					machineName.setAttributeNode(attrName);
			root.appendChild(created)
			root.appendChild(machineName)
			
		this.logline ("Creating DOM Data file")
		this.verbose_logline ("Machine ["+this.host+"] Audit Groups : " + objects.length)
		var data = null
		for(i = 0; i < objects.length; i++){
			obj = objects[i]
			this.verbose_logline("Processing Data Group : " +obj )
			data = this.host_wmi.ExecQuery("SELECT * FROM " + obj)
			this.verbose_logline("Processing Data Group : " + obj + " : count ("+(data.length?data.length:0)+")")
			if(!data.length){ continue; }
			obj_def = this.availableWMIObjects[obj]
			iList = dom.createElement("group")

			// GROUP NAME
			var groupName = dom.createAttribute("name");
					groupName.value = obj.title
					iList.setAttributeNode(groupName);

			// GROUP COLUMN NAMES
			var fieldDef = dom.createElement("fields");
					iList.appendChild(fieldDef)
			for(field in obj_def.fields){
				fieldDefName = dom.createElement("fieldName");
					fieldDefNameValue = dom.createAttribute("name");
					fieldDefNameValue.value = field
					fieldDefName.setAttributeNode(fieldDefNameValue);
					fieldDef.appendChild(fieldDefName)				
			}

			// GROUP ROW DATA
			var enumItems = new Enumerator(data)
				
			for (enumItems.moveFirst(); !enumItems.atEnd(); enumItems.moveNext()){
				var item = enumItems.item();
				iNode = dom.createElement("item")

				this.logline("Processing Object Group Item : " + item.name)
				
				for(field in obj_def.fields){
					value = obj_def.fields[field]!=""?obj_def.fields[field]:""
					this.logline("\tfield : " + obj_def.fields[field] +" = "+value)

					fieldNode = dom.createElement("field")
						fieldNodeFieldName = dom.createAttribute("name");
						fieldNodeFieldName.value = obj_def.fields[field]
						fieldNode.setAttributeNode(fieldNodeFieldName);
						fieldNodeFieldValue = dom.createAttribute("value");
						fieldNodeFieldValue.value = value
						fieldNode.setAttributeNode(fieldNodeFieldValue);
					iNode.appendChild(fieldNode)
				}
				iList.appendChild(iNode);
			}
			root.appendChild(iList);
		}
		dom.appendChild(root)
		
		var str = dom.transformNode(xsl);
		this.logline("HTML OUTPUT : " + str)
		dom.save(this.REPORTFILE_PATH+".xml")
		this.writeReport(str)
		this.logline("Finished")
	}

	this.startLogging = function(){
		this.logfile = this.FSO.OpenTextFile(this.LOGFILE_PATH,2,1)
		this.logline(".-=[ Logging started at" + Date() + " ]=-.")
		this.logline("this.outputPath = " + this.outputPath)
		this.logline("this.LOGFILE_PATH = " + this.LOGFILE_PATH)
		this.logline("this.REPORTFILE_PATH = " + this.REPORTFILE_PATH)
		
	}
	this.verbose_logline = function(msg){
		str = "[ "+ this.AppName + "] : " + msg
		WScript.Echo(str)
		this.logfile.WriteLine(str) 
	}
	this.logline = function(msg){
		str = "[ "+ this.AppName + "] : " + msg
		if (this.verbose_logging) WScript.Echo(str)
		this.logfile.WriteLine(str)
	}
	this.stopLogging = function(){
		//this.logfile.Close()
	}
	this.SetConsoleDebugVerbose = function(verbose){
		this.verbose_logging = verbose
	}
		
}

scriptname = WScript.ScriptName
if( scriptname = "auditsoftware.js"){
	args = WScript.Arguments
	var oSoftMeter = new SoftwareAuditor()
		WScript.Echo("Staring Audit on : " + oSoftMeter.host)
			oSoftMeter.SetConsoleDebugVerbose(args[0]=="verbose")
			oSoftMeter.startLogging()
			oSoftMeter.report()

}



