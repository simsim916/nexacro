gf_showPopup = function (
    strFormId,      // "PIC_UPLOAD"              폼 ID   
    strUrl,         // "co_syst::co_syst_fileupload_download_popup.xfdl"
    positions,      //  {width:592, height:217}  팝업창의 넓이 높이
    arguments,      //  {	A: "hr/perimage",  
                    //      B: this.ds_Master.getColumn(this.ds_Master.rowposition, "PIC_NO"),
                    //      C: 'N'  
                    //	}
    options         //  {callback:"ff_AfterPopup_upload"}
) {

    positions = NXCore.setDefaults(positions, { left: 0, top: 0, width: null, height: null, base: null });
    options = NXCore.setDefaults(options, { callback: "", modal: true, layered: false, autosize: true, showtitlebar: false, resizable: false, opened: 'focus' });

    // modal less일경우 nexacro 즉 runtime일경우는 바로 아내로직 안타고 뒤에서 showModeless로 실행함. 
    if (!options.modal) { // &&  nexacro.Browser != "Runtime" ) {

        var formObj = this;
        var vi_left = vi_height = 0;
        if (nexacro.Browser == "Runtime") {    // runtime일경우 모니터가 2개일경우 스크린 2개의 넗이가 구해지기때문에 아래로직 
            var nMoniterIndex, strScreenXY, vi_monitor_x;
            var vi_totscreen = 0;
            if (!NXCore.isEmpty(positions.width)) {

                if (system.monitorcount == 1) {    // 모니터가 한개 일경우 

                    var vs_temp = system.getScreenResolution(1);
                    var vs_temp1 = vs_temp.split(" ");
                    vi_totscreen = nexacro.toNumber(vs_temp1[0]);
                    vi_left = (nexacro.toNumber(system.getScreenWidth()) - nexacro.toNumber(positions.width)) / 2;
                    if (vi_left < 0) vi_left = 0;
                    var strScreenRes = system.getScreenResolution(1);       // 현재의 모니터 해상도 
                    strScreenXY = strScreenRes.split(" ");                          // x y 좌표

                }
                else {    // 모니터가 1개 이상일경우 (2개 까지 처리가능함)

                    var nCursorX = system.getCursorX();
                    var nCursorY = system.getCursorY();
                    nMoniterIndex = system.getMonitorIndex(nCursorX, nCursorY);    // 현재의 모니터 번호 
                    var strScreenRes = system.getScreenResolution(nMoniterIndex);       // 현재의 모니터 해상도 
                    strScreenXY = strScreenRes.split(" ");                          // x y 좌표
                    vi_monitor_x = 0;
                    for (var i = 1; i <= system.monitorcount; i++) {                      // 현재 모니터의 x 길이를 제외한 다른모니터 x 길이 합 
                        var vs_temp = system.getScreenResolution(i);
                        var vs_temp1 = vs_temp.split(" ");
                        vi_totscreen = vi_totscreen + nexacro.toNumber(vs_temp1[0]);
                        if (i == nMoniterIndex) continue;
                        vi_monitor_x = vi_monitor_x + nexacro.toNumber(vs_temp1[0]);
                    }
                    if (nMoniterIndex == 1) {   //  1 우축일 경우 좌측 모니터 
                        vi_left = vi_monitor_x + (nexacro.toNumber(strScreenXY[0]) - nexacro.toNumber(positions.width)) / 2;
                        var r = system.getScreenRect(1);
                        if (nexacro.toNumber(r.left) < 0) {   // 역방향 일경우 
                            vi_left = -1 * vi_monitor_x;
                            vi_left = vi_left + (nexacro.toNumber(strScreenXY[0]) - nexacro.toNumber(positions.width)) / 2;
                        }
                    }
                    else {
                        vi_left = (vi_totscreen - vi_monitor_x - nexacro.toNumber(positions.width)) / 2;
                        if (vi_left < 0) vi_left = 0;
                    }
                }
            }

            if (!NXCore.isEmpty(positions.height)) {
                var vs_temp1 = nexacro.toNumber(strScreenXY[1]);
                vi_height = (vs_temp1 - nexacro.toNumber(positions.height)) / 2;
                vi_height = nexacro.toNumber(vi_height);
                if (vi_height < 0) vi_height = 0;
            }

            if (!options.autosize) {
                if (nMoniterIndex == 1) {
                    vi_left = vi_monitor_x + 1;
                    var r = system.getScreenRect(1);
                    if (nexacro.toNumber(r.left) < 0) {    // 역방향 
                        vi_left = -1 * vi_monitor_x;
                    }
                }
                else
                    vi_left = 0;
                vi_height = 0;
            }

        }
        // runtime이 아닐경우 아래 로직 
        else {
            if (!NXCore.isEmpty(positions.width)) {
                vi_left = (system.getScreenWidth() - nexacro.toNumber(positions.width)) / 2;
                if (vi_left < 0) vi_left = 0;
            }
            if (!NXCore.isEmpty(positions.height)) {
                vi_height = (system.getScreenHeight() - nexacro.toNumber(positions.height)) / 2;
                if (vi_height < 0) vi_height = 0;
            }
            if (!options.autosize) {
                vi_left = 0;
                vi_height = 0;
            }
        }
        var resultForm = application.open(strFormId, strUrl, formObj.getOwnerFrame(),
            arguments, "showtitlebar=true showstatusbar=true autosize=true resizable=true ", vi_left, vi_height, positions.width, positions.height, formObj);

        return resultForm;
    }

    if (!positions.base) {
        if (NXCore.isFrameForm(this)) {
            positions.base = application.mainframe;
        } else {
            positions.base = this.getOwnerFrame().form;
        }
    }
    if (positions.width == null || positions.height == null) {
        NXCore.alert("e.message", "팝업창의 넓이/높이는 필수 입력 값입니다.");
        return null;
    }

    var formObj = this;
    var strFrameId = strFormId;
    var strFrameUrl = strUrl;
    var frameChild = application.popupframes[strFormId];

    if (frameChild != null) {
        NXCore.setArgument(frameChild, arguments);
        frameChild.setFocus();

        if (options.opened === 'load') {
            try {
                frameChild.form.ff_load(frameChild.form);
            } catch (err) { logger.debug(e.message); }
        }
        return null;
    }

    var newChild = new ChildFrame(strFormId, "absolute", positions.left, positions.top, positions.width, positions.height);

    newChild.set_showtitlebar(options.showtitlebar);
    newChild.style.set_background("transparent");
    newChild.set_formurl(strUrl);
    newChild.set_resizable(options.resizable);
    //newChild.style.set_border("1 solid blue");
    newChild.set_autosize(options.autosize);
    newChild.set_openalign("center middle");
    newChild.style.set_overlaycolor("transparent");

    NXCore.clearArgument(newChild);
    NXCore.setArgument(newChild, arguments);

    if (options.modal) {
        var objResult = newChild.showModal(strFrameId, formObj.getOwnerFrame(), arguments, formObj, NXCore.empty(options.callback, ""));
        formObj.setFocus();
        return objResult;
    } else {
        return newChild.showModeless(strFrameId, formObj.getOwnerFrame(), arguments, formObj, NXCore.empty(options.callback, ""));
    }
}