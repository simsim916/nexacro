/***********************************************************************
 * 01. Creation date      : 2015.05.29
 * 02. Created by         : 이양헌 
 * 03. Revision history   : 
 ***********************************************************************
 */

 include "lib::common_form.xjs";
this.pvs_openretv = undefined;  // 파라메터로 받은 open 시 retv 여부("R" 이면 조회)  
this.pvs_multiselect = undefined;  // 파라메터로 받은 multi select 여부("M" 이면 multi select) 
this.pvs_deptcd = undefined;  // 파라메터로 받은 부서코드 
this.pvs_RtnArr = undefined;  //Array declaration when close button click, making array
/***********************************************************************
 * Event process specification
 ************************************************************************/
// Initializing on Form onload
this.form_onload = function (obj: Form, e: LoadEventInfo) {
    this.gf_formOnload(obj);
    this.ff_load(obj);
}

this.ff_load = function (obj) {
    this.pvs_openretv = NXCore.getParameter(obj, "OpenRetv");     // 파라메터로 받은 open 시 retv 여부 
    this.pvs_multiselect = NXCore.getParameter(obj, "MultSelect");   // 파라메터로 받은 multi select 여부 
    this.pvs_deptcd = NXCore.getParameter(obj, "Argument");     // 파라메터로 받은 argument;
    this.ff_SetCondition();   // 초기 조건 파라메터 셋팅 및 콤보 셋팅
    this.gf_popup_btn_hide(this.div_button, "btn_retrieve")
    // 	if ( this.pvs_openretv == "Y") {
    // 		this.btn_retrieve_onclick();  // 조회
    // 	}

    // 	if ( this.pvs_multiselect == "Y") {
    // 		this.grd_list.set_selecttype("multirow");
    // 	}
    // 	else {
    // 		this.grd_list.set_selecttype("row");
    // 	}
}

// 초기 조건 파라메터 셋팅 및 콤보 셋팅
this.ff_SetCondition = function () {
    this.ds_list.addRow();
    this.ds_list.setColumn(0, "ARG_SDATE", this.gf_today());
}

/*----------------------------------------------------------------------------------
 * 설명      : TRANSACTION 후처리 함수
 * 파라미터 : strSvcId - TRANSACTION ID, nErrorCode - Error Code, strErrorMsg - Error Msg
 * Return값  :
 * 작성자   : 박두현
 * 작성일   : 2010.05.06
 *----------------------------------------------------------------------------------*/
this.ff_Callback = function (sSvcID, ErrorCode, ErrorMsg) {
    if (ErrorCode < 0) {
        NXCore.alert(ErrorMsg);
        return;
    }
    switch (sSvcID) {
        case "SELECT":
            if (this.ds_list.rowcount < 1) {
                this.gf_message_chk("110", ""); // 조회 및 출력할 자료가 없습니다.
            }
            break;
    }
}

this.ff_Callback_sync = function (sSvcID, ErrorCode, ErrorMsg) {

    if (ErrorCode < 0) {
        NXCore.alert(ErrorMsg);
        return;
    }
    switch (sSvcID) {

        case "SELECT":
            break;
    }
}

// 조회 버튼 
this.btn_retrieve_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    this.ff_Tran("SELECT");
}

// 조회 문장 
this.ff_Tran = function (strSvcId) {

    switch (strSvcId) {

        case "SELECT":
            // 넘겨줄 파라메터 셋팅

            v_SvcAct = "co/popu/co_popu_area_f_1q.jsp";
            v_InDataset = "ds_para=ds_head";     // 반드시 기술할것
            v_OutDataset = "ds_list=output1";  // 반드시 output1으로 기술할것
            v_Argument = "";

            break;
    }

    this.gf_Transaction_Async(strSvcId, v_SvcAct, v_InDataset, v_OutDataset, "ff_Callback");

}
// 확인 버튼 
this.btn_confirm_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    this.ff_Confirm();

}
// 더블 클릭
this.grd_list_oncelldblclick = function (obj: Grid, e: nexacro.GridClickEventInfo) {
    this.ff_Confirm();
}

// 확인이나 더블클릭을 눌렀을경우 
this.ff_Confirm = function () {
    // 	var arr_row = this.ds_list.rowcount;
    // 	var vs_data='', vn_cnt=0;
    // 	
    // 	if (arr_row.length == 0 && this.ds_list.rowcount > 0) arr_row = "1"; // 선택 없이 확인 처리 
    // 	
    // 	for ( var i=0; i<arr_row.length; i++) { 
    // 
    // 		if (i!=0) vs_data += '@#@';
    // 		
    // 		for ( var j=0; j<this.ds_list.colcount; j++) { 
    // 			alert(11111);	
    // 			if (i == 0 && j == 0){
    // 				vs_data = this.ds_list.getColumn(arr_row[i],j);
    // 				alert(vs_data);}
    // 			else if (j == 0)
    // 				vs_data += this.ds_list.getColumn(arr_row[i],j);
    // 			else
    // 				vs_data += "|" + this.ds_list.getColumn(arr_row[i],j);
    // 		}
    // 
    // 		vn_cnt = vn_cnt + 1;
    // 	}	

    var vs_ret = '1' + '@!@' + this.ds_list.getColumn(0, "ARG_SDATE");
    this.close(vs_ret);
}

this.btn_close_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {

    this.close("0");  // return count 0 
}
