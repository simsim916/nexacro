/***********************************************************************
 * 01. Creation date      : 2024.07.17
 * 02. Created by         : 최문석
 **********************************************************************/

include "lib::common_form.xjs";

this.pvs_openretv = undefined;  // 파라메터로 받은 open 시 retv 여부("R" 이면 조회)  
this.pvs_multiselect = undefined;  // 파라메터로 받은 multi select 여부("M" 이면 multi select) 
this.pvs_argument = undefined;  // 파라메터로 받은 argument 
this.pvs_ittyp = undefined;  // 파라메터로 받은 품목구분  
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
    this.pvs_argument = new Array;

    this.pvs_openretv = NXCore.getParameter(obj, "OpenRetv");     // 파라메터로 받은 open 시 retv 여부 
    this.pvs_multiselect = NXCore.getParameter(obj, "MultSelect");   // 파라메터로 받은 multi select 여부 
    this.pvs_argument = NXCore.getParameter(obj, "Argument");     // 파라메터로 받은 argument;

    this.ff_SetCondition();   // 초기 조건 파라메터 셋팅 및 콤보 셋팅

    if (this.pvs_openretv == "Y") {
        this.btn_retrieve_onclick();  // 조회
    }

    if (this.pvs_multiselect == "Y") {
        this.grd_list.set_selecttype("multirow");
    }
    else {
        this.grd_list.set_selecttype("row");
    }
}

// 초기 조건 파라메터 셋팅 및 콤보 셋팅
this.ff_SetCondition = function () {
    this.ds_head.addRow();
    var arr_OpenParam = this.pvs_argument.split('|');
    this.ds_head.setColumn(0, "ARG_ITNBR", arr_OpenParam[0]);
    this.ff_Tran("SELECT");
}

// 조회 버튼 
this.btn_retrieve_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    this.ff_Tran("SELECT");
}
// 확인 버튼 
this.btn_confirm_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    this.ff_Confirm();
}
this.btn_close_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    this.close("0");  // return count 0 
}
// 더블 클릭
this.grd_list_oncelldblclick = function (obj: Grid, e: nexacro.GridClickEventInfo) {
    this.ff_Confirm();
}

// 확인이나 더블클릭을 눌렀을경우 
this.ff_Confirm = function () {
    var arr_row = this.grd_list.getSelectedRows();
    var vs_data = '', vn_cnt = 0;

    if (arr_row.length == 0 && this.grd_list.rowcount > 0) arr_row = "1"; // 선택 없이 확인 처리 

    var vs_sql = '';
    var vs_itnbr, vs_itcls;

    vs_itnbr = this.ds_head.getColumn(0, "ARG_ITNBR");
    vs_itcls = this.ds_list.getColumn(this.ds_list.rowposition, "ITCLS_K");

    vs_sql = "SELECT CINBR, ETC1 FROM ITEMAS_SET "
    vs_sql += "  WHERE ITNBR = '" + vs_itnbr + "' "
    vs_sql += "  	AND ITCLS_K = '" + vs_itcls + "' "

    this.gf_SelectSql_sync("ds_temp : " + vs_sql, "CVCOD_SELECT", "ff_Callback_sync");
    if (vi_ErrorCode < 0) return;

    for (var i = 0; i < this.ds_temp.rowcount; i++) {

        if (i != 0) vs_data += '@#@';

        vs_data += this.ds_temp.getColumn(i, "CINBR") + "|" + this.ds_temp.getColumn(i, "ETC1") + "|" + vs_itnbr;

        vn_cnt = vn_cnt + 1;
    }

    var vs_ret = new String(vn_cnt) + '@!@' + vs_data;
    this.close(vs_ret);
}

// 조회 문장 
this.ff_Tran = function (strSvcId) {
    switch (strSvcId) {
        case "SELECT":
            v_SvcAct = "01_moon/co_popu_itemasset_f_1q.jsp";
            v_InDataset = "ds_para=ds_head";     // 반드시 기술할것
            v_OutDataset = "ds_list=output1";  // 반드시 output1으로 기술할것
            v_Argument = "";
            break;
    }
    this.gf_Transaction_Async(strSvcId, v_SvcAct, v_InDataset, v_OutDataset, "ff_Callback");
}

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
    vi_ErrorCode = ErrorCode;     // 콜백루틴의 에러코드        싱크트란잭션일경우 사용
    vs_ErrorMsg = ErrorMsg;      //// 콜백루틴의 에러메세지    싱크트란잭션일경우 사용
    if (ErrorCode < 0) {
        NXCore.alert('CallBack SVCID = ' + sSvcID + '  ErrorCode = ' + ErrorCode + ' MSG = ' + ErrorMsg);
    }

} 