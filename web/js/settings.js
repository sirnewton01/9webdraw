function Settings() {

    this.settings = [];

    this.addsetting = function(setting) {
        setevent(elem(setting), "click", function() {
            return settings.set(setting, this.checked ? true : false);
        });
    }

    this.set = function(name, value) {

        switch (name) {
            case "mousefkeys":
                //mouse.usefkeys = value;
                return false;
            default:
                return true;
        }
        localStorage.setItem(name, value);

    }

    for (var setting in this.settings) {
        this.set(this.settings[setting], localStorage.getItem(this.settings[setting]) == "true" ? true : false);
        this.addsetting(this.settings[setting]);
    }
}