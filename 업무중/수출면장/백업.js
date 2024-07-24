/***********************************************************************
 * 01. Creation date      : 2015.08.31
 * 02. Created by         : 김성욱
 * 03. Revision history   : 
 ************************************************************************/

/*************************************************************************************************************
* 프로그램 필수 
*************************************************************************************************************/
include "lib::common_form.xjs";
include "si_co::si_comm_function.xjs";

var input_Mode = 'I';
var pvs_Update_sql = '';		//update sql 
//item changed를 통해 쿼리가 변경 될 경우 사용, 아닐경우 ff_Tran()에서 직접 입력
var pvs_SvcAct, pvs_Save_SvcAct;
var pvs_OutDataset, pvs_InDataset, pvs_Save_OutDataset, pvs_Save_InDataset;

this.vi_ErrorCode = undefined;     // 콜백루틴의 에러코드        싱크트란잭션일경우 사용
this.vs_ErrorMsg = undefined;      //// 콜백루틴의 에러메세지    싱크트란잭션일경우 사용
var pvs_Mode;					// 등록, 삭제모드 
var pvs_Conf, pvs_Today, pvs_Exvnd, pvs_Exvndnm;

// on load event  페이지가 열릴때
this.form_onload = function (obj: Form, e: nexacro.LoadEventInfo) {
    this.gf_formOnload(obj);
    this.ff_load(obj);
}

//  초기 작업 수행
this.ff_load = function (obj) {
    this.ff_input_mode('I');
}

this.ff_input_mode = function (sMode) {
    input_Mode = sMode;
    this.ff_form_init(input_Mode);
}
/*************************************************************************************************************
* 프로그램 필수 끝
*************************************************************************************************************/

/*************************************************************************************************************
* 입력프로그램 필수??
*************************************************************************************************************/

// 화면을 닫기전에 수정사항이 있으면 저장할것인지 묻는다.
this.form_onbeforeclose = function (obj: Form, e: CloseEventInfo) {
    var vb_true = true;

    if (NXCore.isModified(this.ds_Detail) || NXCore.isModified(this.ds_Detail_1)) {
        if (this.gf_message_chk("1180", "") == "1") //return true;  // 변경된 자료가 있습니다. 취소하시겠습니까?	
        {
            vb_true = true;
        }
        else {
            vb_true = false;
        }
    }

    return vb_true;
}

// 프로그램 초기값 세팅 
this.ff_form_init = function (vs_Mode) {
    this.ds_Head.clearData();
    this.ds_Head.addRow();
    this.ds_Detail.clearData();
    this.ds_Detail_1.clearData();
    this.ds_Hide.clearData();
    var vn_Row = this.ds_Detail.addRow();
    pvs_Today = this.gf_today();

    if (NXCore.isEmpty(application.gvs_defsaupj)) application.gvs_defsaupj = '10';
    var vs_Saupj = application.gvs_defsaupj;
    var vs_Sql = " select x.rfna2 as cd1, nvl(y.cvnas2, y.cvnas) as cd2 "
    vs_Sql += " from reffpf x, vndmst y where x.rfcod = 'AD' and x.rfgub = '" + vs_Saupj + "' and x.rfna2 = y.cvcod ";
    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "JASA_SELECT", "ff_Callback_sync");
    if (vi_ErrorCode < 0) return;
    if (this.ds_Temp.rowcount > 0) {
        pvs_Exvnd = this.ds_Temp.getColumn(0, "CD1");
        pvs_Exvndnm = this.ds_Temp.getColumn(0, "CD2");
    }

    // 콤보 데이타셋 조회
    // combo 세팅 argumnet 5번자리 : @A 전체 포함, @N null 포함
    this.gf_combo_head_sync(this.ds_Detail, "CURR", this.div_Detail.cbo_Curr, "co_dddw_reffpf_f_10_med", "", 0);
    this.gf_combo_head_sync(this.ds_Detail, "EXPGU", this.div_Detail.cbo_Expgu, "co_dddw_reffpf_f_6c", "", 0);
    this.grd_Detail.setCellProperty("Head", 1, "text", "");

    vs_OpenRetv = this.parent.parent.fvs_OpenRetv;    // 넘어온 파라메터 값 
    vs_MultSelect = this.parent.parent.fvs_MultSelect;    // 넘어온 파라메터 값 
    vs_Argument = this.parent.parent.fvs_Argument;    // 넘어온 파라메터 값

    if (!NXCore.isEmpty(this.parent.parent.fvs_OpenRetv) && this.parent.parent.fvs_OpenRetv != '') {

        var vs_param = vs_Argument.split('|');

        if (vs_param[0] == '1') {
            input_Mode = 'I';
        }
        else {
            input_Mode = 'M';
        }

    }

    if (input_Mode == 'I') {
        // 초기 값 세팅
        //이벤트 처리 생략
        this.ds_Detail.set_enableevent(false);

        this.div_Detail.edt_Expno.set_readonly(true);
        this.div_Detail.edt_Expno.set_cssclass("readonly");

        //this.div_Detail.cbo_Expgu.set_readonly(false);
        //this.div_Detail.cbo_Expgu.set_cssclass("input_point");
        this.div_Detail.edt_Cvcod.set_readonly(false);
        this.div_Detail.edt_Cvcod.set_cssclass("input_point");
        this.div_Detail.edt_Cvcodnm.set_readonly(false);
        this.div_Detail.edt_Cvcodnm.set_cssclass("");

        this.div_Detail.sta_Expno_i.set_visible(true);
        this.div_Detail.sta_Expno_m.set_visible(false);
        this.div_Detail.cbx_Del.set_visible(false);

        this.ds_Detail.setColumn(vn_Row, "SAUPJ", vs_Saupj);
        this.ds_Detail.setColumn(vn_Row, "EXPNO", '');
        this.ds_Detail.setColumn(vn_Row, "EXPDAT", pvs_Today);
        this.ds_Detail.setColumn(vn_Row, "EXPPMTDT", pvs_Today);

        this.ds_Detail.setColumn(vn_Row, "EXPGU", '1');
        this.ds_Detail.setColumn(vn_Row, "FOBAMT", 0);
        this.ds_Detail.setColumn(vn_Row, "FOBAMTW", 0);
        this.ds_Detail.setColumn(vn_Row, "EXCHRATE", 0);
        this.ds_Detail.setColumn(vn_Row, "JATAGU", '1');
        this.ds_Detail.setColumn(vn_Row, "LCAMT", 0);
        this.ds_Detail.setColumn(vn_Row, "EXPAMT", 0);
        this.ds_Detail.setColumn(vn_Row, "WAMT", 0);
        this.ds_Detail.setColumn(vn_Row, "UAMT", 0);
        this.ds_Detail.setColumn(vn_Row, "WRATE", 0);
        this.ds_Detail.setColumn(vn_Row, "URATE", 0);
        this.ds_Detail.setColumn(vn_Row, "DUTYEXCH", 'N');

        this.ds_Detail.setColumn(vn_Row, "EXVND", pvs_Exvnd);
        this.ds_Detail.setColumn(vn_Row, "EXVNDNM", pvs_Exvndnm);
        //이벤트 처리
        this.ds_Detail.set_enableevent(true);
        this.div_Detail.cal_Expdat.setFocus();  // cursor set
    }
    else {
        // 초기 값 세팅
        if (NXCore.isEmpty(application.gvs_defsaupj)) application.gvs_defsaupj = '10';
        this.ds_Detail.setColumn(vn_Row, "SAUPJ", application.gvs_defsaupj);

        this.gf_check_saupj(this.div_Detail.cbo_saupj);

        //이벤트 처리 생략
        this.ds_Detail.set_enableevent(false);

        this.div_Detail.edt_Expno.set_readonly(false);
        this.div_Detail.edt_Expno.set_cssclass("input_point");

        //this.div_Detail.cbo_Expgu.set_readonly(true);
        //this.div_Detail.cbo_Expgu.set_cssclass("readonly");
        this.div_Detail.edt_Cvcod.set_readonly(true);
        this.div_Detail.edt_Cvcod.set_cssclass("readonly");
        this.div_Detail.edt_Cvcodnm.set_readonly(true);
        this.div_Detail.edt_Cvcodnm.set_cssclass("readonly");

        this.div_Detail.sta_Expno_i.set_visible(false);
        this.div_Detail.sta_Expno_m.set_visible(true);
        this.div_Detail.cbx_Del.set_visible(true);
        this.ds_Detail.setColumn(vn_Row, "SAUPJ", vs_Saupj);
        this.ds_Detail.setColumn(vn_Row, "EXPNO", '');
        this.ds_Detail.setColumn(vn_Row, "EXPDAT", pvs_Today);
        this.ds_Detail.setColumn(vn_Row, "EXPPMTDT", pvs_Today);

        this.ds_Detail.setColumn(vn_Row, "EXPGU", '1');
        this.ds_Detail.setColumn(vn_Row, "FOBAMT", 0);
        this.ds_Detail.setColumn(vn_Row, "FOBAMTW", 0);
        this.ds_Detail.setColumn(vn_Row, "EXCHRATE", 0);
        this.ds_Detail.setColumn(vn_Row, "JATAGU", '1');
        this.ds_Detail.setColumn(vn_Row, "LCAMT", 0);
        this.ds_Detail.setColumn(vn_Row, "EXPAMT", 0);
        this.ds_Detail.setColumn(vn_Row, "WAMT", 0);
        this.ds_Detail.setColumn(vn_Row, "UAMT", 0);
        this.ds_Detail.setColumn(vn_Row, "WRATE", 0);
        this.ds_Detail.setColumn(vn_Row, "URATE", 0);
        this.ds_Detail.setColumn(vn_Row, "DUTYEXCH", 'N');

        this.ds_Detail.setColumn(vn_Row, "EXVND", pvs_Exvnd);
        this.ds_Detail.setColumn(vn_Row, "EXVNDNM", pvs_Exvndnm);

        //이벤트 처리
        this.ds_Detail.set_enableevent(true);
        this.div_Detail.edt_Expno.setFocus();  // cursor set
    }

    if (!NXCore.isEmpty(this.parent.parent.fvs_OpenRetv) && this.parent.parent.fvs_OpenRetv != '') {
        if (vs_param[0] == '1') {
            this.ds_Detail.setColumn(0, "CVCOD", vs_param[1]);
            this.ds_Detail.setColumn(0, "CURR", vs_param[2]);
        }
        else {
            this.ds_Detail.setColumn(0, "EXPNO", vs_param[4]);

            this.div_Input_Mode.Div00.btn_Modify.bringToPrev();
            this.div_Input_Mode.Div00.btn_Input.style.set_opacity(40);
            this.div_Input_Mode.Div00.btn_Modify.style.set_opacity(100);

            this.parent.parent.fvs_OpenRetv = '';

            this.btn_query_onclick();
        }
    }
}

/////////////////////////////////////////////////////////////////////////////////
// 입력 프로그램 필수 끝
/////////////////////////////////////////////////////////////////////////////////
//버튼 처리            
//프로그램별 버튼 세팅 : 시스템 - 시스템관리 - 프로그램 등록 에서 처리 
//DB : MENU_DETAIL 의 해당 컬럼 참조 																					
//이벤트 : this.btn_"컬럼명( 끝의'YN'제외)"_onclick = function(obj:Button,  e:nexacro.ClickEventInfo)					
//예졔 : 																													
//조회버튼 : this.btn_query_onclick = function(obj:Button,  e:nexacro.ClickEventInfo)										
//생성버튼 : this.btn_create_onclick = function(obj:Button,  e:nexacro.ClickEventInfo)									
/////////////////////////////////////////////////////////////////////////////////
//취소 
this.btn_cancel_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    this.ff_input_mode(input_Mode);
}

// 닫기
this.btn_close_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    this.gf_closeMenu();
}

//복사
this.btn_copy_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    return;
}

//조회 
this.btn_query_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    if (input_Mode == 'I') return;
    this.ds_Head.clearData();
    this.ds_Head.addRow();
    this.ds_Head.setColumn(0, "ARG_EXPNO", this.ds_Detail.getColumn(this.ds_Detail.rowposition, "EXPNO"));

    if (!this.ff_required_chk("M")) return;

    this.ff_Tran("SELECT_DETAIL");

}

// 추가
this.btn_add_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vs_Arg = '';

    var vs_Expdat = this.ds_Detail.getColumn(this.ds_Detail.rowposition, "EXPDAT");
    if (NXCore.isEmpty(vs_Expdat)) {
        this.gf_message_chk("102347", ''); //일자를 입력하십시오.
        this.div_Detail.cal_Expdat.setFocus();  // cursor set
        return;
    }
    var vs_Curr = this.ds_Detail.getColumn(this.ds_Detail.rowposition, "CURR");
    if (NXCore.isEmpty(vs_Curr)) {
        this.gf_message_chk("103328", ''); //통화단위를 입력하십시오.
        this.div_Detail.cbo_Curr.setFocus();  // cursor set
        return;
    }
    var vs_Expgu = this.ds_Detail.getColumn(this.ds_Detail.rowposition, "EXPGU");
    if (NXCore.isEmpty(vs_Expgu)) {
        this.gf_message_chk("101777", ''); //수출구분을 입력하십시오.
        this.div_Detail.cbo_Expgu.setFocus();  // cursor set
        return;
    }
    var vs_Cvcod = this.ds_Detail.getColumn(this.ds_Detail.rowposition, "CVCOD");
    if (NXCore.isEmpty(vs_Cvcod)) {
        this.gf_message_chk("100046", ''); //Buyer 를 입력하십시오.
        this.div_Detail.edt_Cvcod.setFocus();  // cursor set
        return;
    }
    //this.div_Detail.cbo_Expgu.set_readonly(true);
    //this.div_Detail.cbo_Expgu.set_cssclass("readonly");
    this.div_Detail.edt_Cvcod.set_readonly(true);
    this.div_Detail.edt_Cvcod.set_cssclass("readonly");
    this.div_Detail.edt_Cvcodnm.set_readonly(true);
    this.div_Detail.edt_Cvcodnm.set_cssclass("readonly");

    if (vs_Expgu == '4' && vn_Row > 0) {
        this.gf_message_chk("100390", ''); //계산서/반품은 Invoice 1건만 등록가능합니다.
        return;
    }
    var vn_Row = this.ds_Detail_1.rowcount;
    var vn_Row_1 = this.ds_Detail_1.rowcount - 1;
    if (vn_Row > 0) {
        var vs_Cino = this.ds_Detail_1.getColumn(vn_Row_1, "CINO");
        if (NXCore.isEmpty(vs_Cino)) {
            this.gf_message_chk("250", ''); //필수입력항목을 확인하여 주십시요
            this.gf_cursor_setting(this.grd_Detail, vn_Row_1, 'CINO');
            return;
        }
    }
    var vn_Row = this.ds_Detail_1.addRow();
    this.ds_Detail_1.setColumn(vn_Row, "EXPAMT", 0);
    this.ds_Detail_1.setColumn(vn_Row, "WAMT", 0);
    this.ds_Detail_1.setColumn(vn_Row, "UAMT", 0);
    this.ds_Detail_1.setColumn(vn_Row, "FOBAMT", 0);
    this.ds_Detail_1.setColumn(vn_Row, "FOBAMTW", 0);

    var vSaupj = this.ds_Detail.getColumn(0, "SAUPJ");
    var vs_Cvnas = this.ds_Detail.getColumn(0, "CVCODNM");
    if (vs_Expgu == '2') {
        vs_Arg = 'Y|A|';	// Local // 매출확정
    }
    else if (vs_Expgu == '4') {
        vs_Arg = 'RETURNS|N|';
    }
    else {
        vs_Arg = 'N|A|';	// Direct
    }

    vs_Arg = vs_Arg + '|' + vs_Cvcod + '|' + vs_Cvnas;
    var resultForm = this.gf_showPopup("popup_cino", "co_popu::co_popu_expci_f.xfdl", { width: 10, height: 20 },
        {
            OpenRetv: 'Y',   // popup open 즉시 조회
            MultSelect: 'N',   // MULTI LINE 선택
            Argument: vs_Arg	// 조회조건 파라메터
        }, { callback: "ff_AfterPopup" });

    this.gf_cursor_setting(this.grd_Detail, vn_Row, 'CINO');
}

// 삽입
this.btn_insert_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    return;
}

// 삭제
this.btn_delete_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    pvs_Update_sql = '';
    //수출구분
    var vs_Expgu = this.ds_Detail.getColumn(0, "EXPGU");
    //매출 확정일
    var vn_Salecnf = this.ff_Salecnf(vs_Expgu);
    var vs_Expno = this.ds_Detail.getColumn(0, "EXPNO");

    if (this.ds_Detail.getColumn(0, "DEL") == 'true') {
        //전체삭제의 경우
        var vs_Expno = this.ds_Detail.getColumn(this.ds_Detail.rowposition, "EXPNO");
        if (NXCore.isEmpty(vs_Expno)) return;

        if (this.gf_message_chk("1115", '') == '1') {
            // Msg : 삭제 하시겠습니까?
            //this.ds_Detail.deleteRow(this.ds_Detail.rowposition);

            var vn_Row = this.ds_Detail_1.rowcount;
            var vn_Row_1 = this.ds_Detail_1.rowcount - 1;
            if (vn_Row > 0) {
                for (var i = vn_Row_1; i >= 0; i--) {
                    var vs_Cino = this.ds_Detail_1.getColumn(i, "CINO");

                    var vs_Sql2 = " SELECT BLNO  FROM EXPCIH WHERE  CINO = '" + vs_Cino + "' ";
                    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql2, "SELECT_CVCOD", "ff_Callback");

                    if (!NXCore.isEmpty(this.ds_Temp.getColumn(0, "BLNO"))) {
                        this.gf_message_chk("100034", "");
                        return;
                    }

                    if (NXCore.isEmpty(vs_Cino)) {
                        this.ds_Detail_1.deleteRow(i);
                        continue;
                    }
                    else {
                        if (vn_Salecnf == '1' || vn_Salecnf == '4') {
                            if (pvs_Update_sql == "") {
                                pvs_Update_sql += " update expcih "
                                    + " set saledt = '' , expno = '' , "
                                    + "     fobamt = 0 , fobamtw = 0 "
                                    + " where cino = '" + vs_Cino + "' ";
                            }
                            else {
                                pvs_Update_sql += "@#$ ";
                                pvs_Update_sql += " update expcih "
                                    + " set saledt = '' , expno = '' , "
                                    + "     fobamt = 0 , fobamtw = 0 "
                                    + " where cino = '" + vs_Cino + "' ";
                            }
                        }
                        else {
                            if (pvs_Update_sql == "") {
                                pvs_Update_sql += " update expcih "
                                    + " set expno = '' , fobamt = 0 , fobamtw = 0 "
                                    + " where cino = '" + vs_Cino + "' ";
                            }
                            else {
                                pvs_Update_sql += "@#$ ";
                                pvs_Update_sql += " update expcih "
                                    + " set expno = '' , fobamt = 0 , fobamtw = 0 "
                                    + " where cino = '" + vs_Cino + "' ";
                            }
                        }
                        this.ds_Detail_1.deleteRow(i);
                    }
                }

                this.ds_Detail.deleteRow(this.ds_Detail.rowposition);
            }

            //CI 정보 처리
            if (pvs_Update_sql != "") {
                this.gf_UpdateSql_sync(pvs_Update_sql, 'DELETE_ALL_SQL', "ff_Callback_sync", 0);
            }
            // 		else{
            // 			this.ff_Tran("DELETE_ALL");
            // 		}
            this.ds_Detail.deleteRow(0);

            this.ff_Tran("DELETE_ALL");

        }
        else {
            return;
        }
    }
    else {
        if (this.ds_Detail_1.rowcount <= 0) return;

        var vs_Chkcnt = 0;
        var vn_Row = this.ds_Detail_1.rowcount;
        var vn_Row_1 = this.ds_Detail_1.rowcount - 1;
        if (vn_Row > 0) {
            for (var i = vn_Row_1; i >= 0; i--) {
                var vs_Chk = this.ds_Detail_1.getColumn(i, "CHK");
                if (vs_Chk == '1') {
                    vs_Chkcnt++;
                }
            }
        }
        if (vs_Chkcnt == 0) {
            this.gf_message_chk("101602", ''); //선택된 자료가 없습니다.
            return;
        }
        //수출구분
        var vs_Expgu = this.ds_Detail.getColumn(0, "EXPGU");
        //매출 확정일
        var vn_Salecnf = this.ff_Salecnf(vs_Expgu);
        var vs_Expno = this.ds_Detail.getColumn(0, "EXPNO");
        if (this.gf_message_chk("1115", '') == '1') // Msg : 삭제 하시겠습니까?
        {
            var vn_Row = this.ds_Detail_1.rowcount;
            var vn_Row_1 = this.ds_Detail_1.rowcount - 1;
            if (vn_Row > 0) {
                for (var i = vn_Row_1; i >= 0; i--) {
                    var vs_Cino = this.ds_Detail_1.getColumn(i, "CINO");

                    var vs_Sql2 = " SELECT BLNO  FROM EXPCIH WHERE  CINO = '" + vs_Cino + "' ";
                    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql2, "SELECT_CVCOD", "ff_Callback");

                    if (!NXCore.isEmpty(this.ds_Temp.getColumn(0, "BLNO"))) {
                        this.gf_message_chk("100034", "");
                        return;
                    }

                    if (NXCore.isEmpty(vs_Cino) || input_Mode == 'I') {
                        this.ds_Detail_1.deleteRow(i);
                        continue;
                    }
                    else {
                        if (vn_Salecnf == '1' || vn_Salecnf == '4') {
                            if (pvs_Update_sql == "") {
                                pvs_Update_sql += " update expcih "
                                    + " set saledt = '' , expno = '' , "
                                    + "     fobamt = 0 , fobamtw = 0 "
                                    + " where cino = '" + vs_Cino + "' ";
                            }
                            else {
                                pvs_Update_sql += "@#$ ";
                                pvs_Update_sql += " update expcih "
                                    + " set saledt = '' , expno = '' , "
                                    + "     fobamt = 0 , fobamtw = 0 "
                                    + " where cino = '" + vs_Cino + "' ";
                            }
                        }
                        else {
                            if (pvs_Update_sql == "") {
                                pvs_Update_sql += " update expcih "
                                    + " set expno = '' , fobamt = 0 , fobamtw = 0 "
                                    + " where cino = '" + vs_Cino + "' ";
                            }
                            else {
                                pvs_Update_sql += "@#$ ";
                                pvs_Update_sql += " update expcih "
                                    + " set expno = '' , fobamt = 0 , fobamtw = 0 "
                                    + " where cino = '" + vs_Cino + "' ";
                            }
                        }

                        this.gf_UpdateSql_sync(pvs_Update_sql, 'DELETE_SQL', "ff_Callback_sync", 0);
                        this.ds_Detail_1.deleteRow(i);
                    }
                }
            }



        }
        else {
            return;
        }
    }
}

// 저장
this.btn_save_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vs_Chkyn = 'N', vs_Chkyn2 = 'N';
    if (NXCore.isModified(this.ds_Detail)) {
        vs_Chkyn = 'Y';	//변경된 자료 있음
    }
    if (NXCore.isModified(this.ds_Detail_1)) {
        vs_Chkyn2 = 'Y';	//변경된 자료 있음
    }
    if (vs_Chkyn == 'N') {
        this.gf_message_chk("291", "");  //alert("변경된 자료가 없습니다.");
        return;
    }

    if (!this.ff_required_chk('I')) {
        return;   // 에러 발생시 리턴
    }

    if (this.gf_message_chk("1120", "") == 1) {
        // Msg : 저장 하시겠습니까?
        //저장시 필수 입력 체크 및 값 입력 
        if (input_Mode == 'I') {
            var vs_Expdat = this.ds_Detail.getColumn(this.ds_Detail.rowposition, 'EXPDAT');
            var vs_Expno = this.ds_Detail.getColumn(this.ds_Detail.rowposition, 'EXPNO');
            if (NXCore.isEmpty(vs_Expno)) {
                //전표번호 생성
                var vs_Seq = this.gf_get_junpyo(vs_Expdat, "X3");
                if (NXCore.isEmpty(vs_Seq)) {
                    this.gf_message_chk("102818", ''); //전표채번오류
                    return;
                }
                vs_Expno = vs_Expdat + vs_Seq;
                this.ds_Detail.setColumn(this.ds_Detail.rowposition, 'EXPNO', vs_Expno);
            }
        }
        else {
            var vs_Expno = this.ds_Detail.getColumn(this.ds_Detail.rowposition, 'EXPNO');
        }

        if (NXCore.isEmpty(vs_Expno)) {
            this.gf_message_chk("101780", ''); //수출면장번호를 확인하십시오.
            return;
        }
        var vs_Expgu = this.ds_Detail.getColumn(this.ds_Detail.rowposition, 'EXPGU');
        var vs_Exppmtdt = this.ds_Detail.getColumn(this.ds_Detail.rowposition, 'EXPPMTDT');
        var vn_Salecnf = this.ff_Salecnf(vs_Expgu);
        pvs_Update_sql = '';
        this.ff_Updatefob();

        for (i = 0; i <= this.ds_Detail_1.rowcount - 1; i++) {
            var vs_Cino = this.ds_Detail_1.getColumn(i, "CINO");
            if (NXCore.isEmpty(vs_Cino)) {
                this.gf_message_chk("200", this.gf_get_trans_word("C/I"));
                this.gf_cursor_setting(this.grd_Detail, i, 'CINO');
                return;
            }
            switch (vs_Expgu) {
                case '2': //Local
                    this.ds_Detail_1.setColumn(i, "EXPNO", vs_Expno);
                    break;
                case '4': //반품
                    this.ds_Detail_1.setColumn(i, "EXPNO", vs_Expno);
                    this.ds_Detail_1.setColumn(i, "SALEDT", vs_Exppmtdt);
                    this.ds_Detail_1.setColumn(i, "SHIPDAT", vs_Exppmtdt);
                    break;
                default:
                    if (vn_Salecnf == '1') {
                        this.ds_Detail_1.setColumn(i, "EXPNO", vs_Expno);
                        this.ds_Detail_1.setColumn(i, "SALEDT", vs_Exppmtdt);
                    }
                    else {
                        this.ds_Detail_1.setColumn(i, "EXPNO", vs_Expno);
                    }
                    break;
            }
            var vs_Dsaledt = this.ds_Detail_1.getColumn(i, "SALEDT");
            var vs_Dexpno = this.ds_Detail_1.getColumn(i, "EXPNO");
            var vn_Dfobamt = this.ds_Detail_1.getColumn(i, "FOBAMT");
            var vn_Dfobamtw = this.ds_Detail_1.getColumn(i, "FOBAMTW");
            var vn_Dwamt = this.ds_Detail_1.getColumn(i, "WAMT");//** 문석추가
            var vn_Duamt = this.ds_Detail_1.getColumn(i, "UAMT");//** 문석추가
            //if (this.ds_Detail_1.getRowType(i) == "4")

            if (NXCore.isEmpty(vs_Dsaledt)) vs_Dsaledt = '';
            if (NXCore.isEmpty(vn_Dfobamt)) vn_Dfobamt = 0;
            if (NXCore.isEmpty(vn_Dfobamtw)) vn_Dfobamtw = 0;

            if (vs_Chkyn2 == 'Y' && input_Mode == 'I') {
                if (pvs_Update_sql == "") {

                    pvs_Update_sql += " update expcih "
                        + " set saledt = '" + vs_Exppmtdt + "' , expno = '" + vs_Dexpno + "' , "
                        + "     fobamt = " + vn_Dfobamt + " , fobamtw = " + vn_Dfobamtw + " "
                        + "		, wamt = " + vn_Dwamt + " , uamt = " + vn_Duamt + " " //** 문석추가
                        + " where cino = '" + vs_Cino + "' ";


                }
                else {

                    pvs_Update_sql += "@#$ ";
                    pvs_Update_sql += " update expcih "
                        + " set saledt = '" + vs_Exppmtdt + "' , expno = '" + vs_Dexpno + "' , "
                        + "     fobamt = " + vn_Dfobamt + " , fobamtw = " + vn_Dfobamtw + " "
                        + "		, wamt = " + vn_Dwamt + " , uamt = " + vn_Duamt + " " //** 문석추가
                        + " where cino = '" + vs_Cino + "' ";
                }

                //this.gf_UpdateSql_sync(pvs_Update_sql, 'UPDATE_SQL',"ff_Callback_sync", 0);
            }
            else {
                if (vs_Chkyn == 'Y' && input_Mode != 'I') {
                    if (pvs_Update_sql == "") {

                        pvs_Update_sql += " update expcih "
                            + " set saledt = '" + vs_Exppmtdt + "',  "
                            + "     fobamt = " + vn_Dfobamt + " , fobamtw = " + vn_Dfobamtw + " "
                            + "		, wamt = " + vn_Dwamt + " , uamt = " + vn_Duamt + " " //** 문석추가
                            + " where cino = '" + vs_Cino + "' ";


                    }
                    else {

                        pvs_Update_sql += "@#$ ";
                        pvs_Update_sql += " update expcih "
                            + " set saledt = '" + vs_Exppmtdt + "',  "
                            + "     fobamt = " + vn_Dfobamt + " , fobamtw = " + vn_Dfobamtw + " "
                            + "		, wamt = " + vn_Dwamt + " , uamt = " + vn_Duamt + " " //** 문석추가
                            + " where cino = '" + vs_Cino + "' ";

                    }
                }
            }
        }


        this.ff_Tran("SAVE_ALL");
    }
    else {
        return;
    }
}


// 계산서 삭제
this.btn_etc1_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vMod, vExpgu, vCheckno, vSaleCnf, vCino;
    var nRowCnt_dt = 0;
    var i = 0;

    vMod = input_Mode;
    vExpgu = this.ds_Detail.getColumn(0, "EXPGU");

    if (vMod == "I") {
        return;
    }

    if (vExpgu == "1" || vExpgu == "3") {
        alert("Local 면장에 한하여 처리가능합니다.");
        return;
    }

    if (application.confirm("계산서내역을 삭제하시겠습니까?") == false) {
        return;
    }

    nRowCnt_dt = this.ds_Detail_1.rowcount;

    if (nRowCnt_dt > 0) {
        vCheckno = this.ds_Detail_1.getColumn(0, "CHECKNO");

        pvs_Update_sql += " DELETE FROM SALEH "
            + " WHERE CHECKNO = '" + vCheckno + "' ";

        //--------------------------------------------
        //// CI UPDATE
        //--------------------------------------------
        vSaleCnf = this.ff_Salecnf("2");

        for (i = 0; i <= nRowCnt_dt - 1; i++) {
            vCino = this.ds_Detail_1.getColumn(i, "CINO");

            if (vSaleCnf == "1" && vExpgu != "4") {
                pvs_Update_sql += "@#$ ";
                pvs_Update_sql += " UPDATE EXPCIH        "
                    + " SET CHECKNO = null,  "
                    + "     SALEDT  = null   "
                    + " WHERE CINO = '" + vCino + "' ";
            }
            else {
                pvs_Update_sql += "@#$ ";
                pvs_Update_sql += " UPDATE EXPCIH "
                    + "    SET CHECKNO = null "
                    + " WHERE CINO = '" + vCino + "' ";
            }

            pvs_Update_sql += "@#$ ";
            pvs_Update_sql += " UPDATE IMHIST_SAL "
                + "    SET CHECKNO = null "
                + "  WHERE INV_NO = '" + vCino + "' ";
        }

        this.gf_UpdateSql_sync(pvs_Update_sql, 'DELETE_SQL', "ff_Callback_sync", 0);
    }

    //---------------
    //---------------
    this.btn_query_onclick();
}

// 계산서 발행
this.btn_etc2_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vMod, vSaupj, vExpgu;

    vMod = input_Mode;

    if (vMod == "I") {
        return;
    }

    vSaupj = this.ds_Detail.getColumn(0, "SAUPJ");

    vExpgu = this.ds_Detail.getColumn(0, "EXPGU");

    if (vExpgu == "2" || vExpgu == "4") {
        var vCheckno = this.ds_Detail_1.getColumn(0, "CHECKNO");

        if (!NXCore.isEmpty(vCheckno) && vCheckno != '') {
            alert("이미 계산서 발행된 내역입니다.");
            return;

        }

        //----------------------------------------
        //// 세금계산서 생성
        //----------------------------------------
        var nRtn = this.ff_CreateSaleh();

        if (nRtn < 0) {
            alert("계산서 발행에 실패하였습니다!!");
            return;
        }
    }
    else {
        alert("LOCAL수출만 계산서 발행이 가능합니다!!");
        return;
    }

    //-------------------------------------
    //// 자료 조회...
    //-------------------------------------
    this.btn_query_onclick();
}
/****************************************************************************************************************************
 * 버튼 처리 끝                                                                                                               
 ****************************************************************************************************************************/


/***************************************************************************************************************************
*Form event 처리 
****************************************************************************************************************************/
// ITEM CHANGED 처리 
// 해당 object의 이벤트에서 "ff_Object_onitemchanged"로 추가 
this.ff_Object_onitemchanged = function (obj: Object, e) {
    var vs_Data;			//이벤트에서 데이터 값  
    var vs_Sql; 			//Sql의 값
    var vn_Row; 			// 해당 row 값  

    // dataset과 다른 object로 나눠서 처리 
    // obj가 dataset으로 인식 함
    //alert('ff_Object_onitemchanged');
    if (obj == '[object Dataset]') {
        vn_Row = e.row;
        vs_Data = e.newvalue;
        // dataset 이름 별로 처리
        if (obj.id == 'ds_Detail') {
            switch (e.columnid) {
                case 'EXPGU':
                    if (NXCore.isEmpty(vs_Data) || vs_Data == '') {
                        this.div_Detail.stk_Exppmtdt.set_text('면장일자');
                        return;
                    }
                    if (vs_Data == '1') {
                        this.div_Detail.stk_Exppmtdt.set_text('면장일자');
                    }
                    else if (vs_Data == '2') {
                        this.div_Detail.stk_Exppmtdt.set_text('계산서일자');
                    }
                    else if (vs_Data == '4') {
                        this.div_Detail.stk_Exppmtdt.set_text('반품일자');
                    }
                    else {
                        this.div_Detail.stk_Exppmtdt.set_text('면장일자');
                    }

                    if (vs_Data == '1') {
                        this.ds_Detail.setColumn(vn_Row, "EXVND", pvs_Exvnd);
                        this.ds_Detail.setColumn(vn_Row, "EXVNDNM", pvs_Exvndnm);
                    }
                    else {
                        this.ds_Detail.setColumn(vn_Row, "EXVND", '');
                        this.ds_Detail.setColumn(vn_Row, "EXVNDNM", '');
                    }
                    break;
                case 'EXPNO':
                    if (input_Mode == 'I') return;
                    if (NXCore.isEmpty(vs_Data) || vs_Data == '') {
                        return;
                    }
                    vs_Sql = " SELECT expno as cd1 FROM export WHERE expno = '" + vs_Data + "' ";
                    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "EXPNO_SELECT", "ff_Callback_sync");
                    if (vi_ErrorCode < 0) return;
                    if (this.ds_Temp.rowcount == 0) {
                        this.ds_Detail.setColumn(vn_Row, "EXPNO", "");
                        this.div_Detail.edt_Expno.setFocus();  // cursor set
                        this.gf_message_chk("100900", "");		//등록되지 않은 수출번호 입니다.
                        return;
                    }
                    else {
                        this.btn_query_onclick();
                        //this.div_Detail.edt_Expno.setFocus();  // cursor set
                    }
                    break;
                case 'EXPDAT':
                    if (NXCore.isEmpty(vs_Data) || vs_Data == '') {
                        return;
                    }
                    if (this.gf_datecheck(vs_Data) < 0) {
                        this.gf_message_chk("180", this.gf_get_trans_word("일자")); // 날짜 오류 
                        this.div_Detail.obj.name.setFocus();  // cursor set
                    }
                    break;
                case 'CVCOD':
                    if (NXCore.isEmpty(vs_Data) || vs_Data == '') {
                        this.ds_Detail.setColumn(vn_Row, "CVCODNM", "");
                        this.div_Detail.edt_Cvcod.setFocus();  // cursor set
                        return;
                    }
                    vs_Sql = "SELECT nvl(CVNAS2, cvnas) AS CVNAS "
                    vs_Sql += " FROM VNDMST WHERE CVSTATUS <> '2' AND CVCOD = '" + vs_Data + "'";
                    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "CVCOD_SELECT", "ff_Callback_sync");
                    if (vi_ErrorCode < 0) return;
                    if (this.ds_Temp.rowcount == 0) {
                        this.gf_message_chk("100876", "");		//등록되지 않은 거래처 코드 입니다.
                        this.ds_Detail.setColumn(vn_Row, "CVCOD", "");
                        this.ds_Detail.setColumn(vn_Row, "CVCODNM", "");
                        this.div_Detail.edt_Cvcod.setFocus();  // cursor set
                    }
                    else {
                        this.ds_Detail.setColumn(vn_Row, "CVCODNM", this.ds_Temp.getColumn(0, "CVNAS"));
                        this.div_Detail.edt_Cvcod.setFocus();  // cursor set
                    }
                    break;



                case 'EXVND':
                    if (NXCore.isEmpty(vs_Data) || vs_Data == '') {
                        this.ds_Detail.setColumn(vn_Row, "EXVNDNM", "");
                        this.div_Detail.edt_Exvnd.setFocus();  // cursor set
                        return;
                    }
                    vs_Sql = "SELECT nvl(CVNAS2, cvnas) AS CVNAS "
                    vs_Sql += " FROM VNDMST WHERE CVSTATUS <> '2' AND CVCOD = '" + vs_Data + "'";
                    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "EXVND_SELECT", "ff_Callback_sync");
                    //if (vi_ErrorCode < 0 ) return;					
                    if (this.ds_Temp.rowcount == 0) {
                        this.gf_message_chk("100876", "");		//등록되지 않은 거래처 코드 입니다.
                        this.ds_Detail.setColumn(vn_Row, "EXVND", "");
                        this.ds_Detail.setColumn(vn_Row, "EXVNDNM", "");
                        this.div_Detail.edt_Exvnd.setFocus();  // cursor set
                    }
                    else {
                        this.ds_Detail.setColumn(vn_Row, "EXVNDNM", this.ds_Temp.getColumn(0, "CVNAS"));
                        this.div_Detail.edt_Exvnd.setFocus();  // cursor set
                    }
                    break;
                case 'GWVND':
                    if (NXCore.isEmpty(vs_Data) || vs_Data == '') {
                        this.ds_Detail.setColumn(vn_Row, "GWVNDNM", "");
                        this.div_Detail.edt_Gwvnd.setFocus();  // cursor set
                        return;
                    }
                    vs_Sql = "SELECT nvl(CVNAS2, cvnas) AS CVNAS "
                    vs_Sql += " FROM VNDMST WHERE CVSTATUS <> '2' AND CVCOD = '" + vs_Data + "'";
                    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "GWVND_SELECT", "ff_Callback_sync");
                    if (vi_ErrorCode < 0) return;
                    if (this.ds_Temp.rowcount == 0) {
                        this.gf_message_chk("100876", "");		//등록되지 않은 거래처 코드 입니다.
                        this.ds_Detail.setColumn(vn_Row, "GWVND", "");
                        this.ds_Detail.setColumn(vn_Row, "GWVNDNM", "");
                        this.div_Detail.edt_Gwvnd.setFocus();  // cursor set
                    }
                    else {
                        this.ds_Detail.setColumn(vn_Row, "GWVNDNM", this.ds_Temp.getColumn(0, "CVNAS"));
                        this.div_Detail.edt_Gwvnd.setFocus();  // cursor set
                    }
                    break;



                case 'EXPPMTDT':
                    if (NXCore.isEmpty(vs_Data) || vs_Data == '') {
                        return;
                    }
                    if (this.gf_datecheck(vs_Data) < 0) {
                        this.gf_message_chk("180", this.gf_get_trans_word("일자")); // 날짜 오류 
                        this.div_Detail.obj.name.setFocus();  // cursor set
                    }
                    var vs_Curr = this.ds_Detail.getColumn(vn_Row, "CURR");
                    this.ff_Curr(vs_Data, vs_Curr, vn_Row);
                    break;
                case 'CURR':
                    var vs_Date = this.ds_Detail.getColumn(vn_Row, "EXPPMTDT");
                    this.ff_Curr(vs_Date, vs_Data, vn_Row);
                    break;
                case 'EXPLCNO':
                    var vn_Row = this.ds_Detail.rowposition;
                    if (NXCore.isEmpty(vs_Data) || vs_Data == '') {
                        this.ds_Detail.setColumn(vn_Row, "EXPLCNO", "");
                        this.ds_Detail.setColumn(vn_Row, "LCAMT", 0);
                        return;
                    }
                    else {
                        this.ff_SelectLcno(vs_Data);
                    }
                    break;
                case 'EXPAMT':
                    /*this.ds_Detail.set_enableevent(false);
                    var vs_Date = this.ds_Detail.getColumn(vn_Row, "EXPPMTDT");
                    var vs_Curr = this.ds_Detail.getColumn(vn_Row, "CURR");
                	
                    this.ff_Curr(vs_Date, vs_Curr, vn_Row);*/

                    if (NXCore.isEmpty(vs_Data) || vs_Data == '' || vs_Data == 0) {
                        this.ds_Detail.setColumn(vn_Row, "WAMT", 0);
                        this.ds_Detail.setColumn(vn_Row, "UAMT", 0);
                        return;
                    }
                    var vn_Wrate = this.ds_Detail.getColumn(0, "WRATE");
                    var vn_Urate = this.ds_Detail.getColumn(0, "URATE");
                    var vn_Weigh = this.ds_Detail.getColumn(0, "WEIGHT");

                    if (vn_Wrate == null || vn_Wrate == 0) vn_Wrate = 1;
                    if (vn_Urate == null || vn_Urate == 0) vn_Urate = 1;
                    if (vn_Weigh == null || vn_Weigh == 0) vn_Weigh = 1;

                    var vn_Wamt = vs_Data * vn_Wrate / vn_Weigh;
                    var vn_Uamt = vs_Data * vn_Urate / vn_Weigh;
                    vn_Wamt = this.gf_trunc(vn_Wamt, 0);
                    vn_Uamt = this.gf_trunc(vn_Uamt, 2);
                    //vn_Wamt = Math.round(vn_Wamt, 0);
                    //vn_Uamt = Math.round(vn_Uamt, 2);

                    this.ds_Detail.setColumn(vn_Row, "WAMT", vn_Wamt);
                    this.ds_Detail.setColumn(vn_Row, "UAMT", vn_Uamt);
                    //this.ds_Detail.set_enableevent(true);
                    break;
                case 'WAMT':
                    var vn_Wamt = vs_Data;
                    var vn_Expamt = this.ds_Detail.getColumn(vn_Row, "EXPAMT");
                    var vn_Weight = this.ds_Detail.getColumn(vn_Row, "WEIGHT");

                    if (vn_Weight == null || vn_Weight == 0) vn_Weight = 1;
                    if (vn_Expamt == null || vn_Expamt == 0) {
                        var vn_Wrate = 0;
                    }
                    else {
                        var vn_Temp = vn_Wamt * vn_Weight / vn_Expamt;
                        var vn_Wrate = Math.round(vn_Temp, 2);
                    }
                    this.ds_Detail.setColumn(vn_Row, "WRATE", vn_Wrate);
                    break;
                case 'UAMT':
                    var vn_Uamt = vs_Data;
                    var vn_Expamt = this.ds_Detail.getColumn(vn_Row, "EXPAMT");
                    var vn_Weight = this.ds_Detail.getColumn(vn_Row, "WEIGHT");

                    if (vn_Weight == null || vn_Weight == 0) vn_Weight = 1;
                    if (vn_Expamt == null || vn_Expamt == 0) {
                        var vn_Urate = 0;
                    }
                    else {
                        var vn_Temp = vn_Uamt * vn_Weight / vn_Expamt;
                        var vn_Urate = Math.round(vn_Temp, 4);
                    }
                    this.ds_Detail.setColumn(vn_Row, "URATE", vn_Urate);
                    break;
                case 'WRATE':
                    var vn_Wrate = vs_Data;
                    var vn_Expamt = this.ds_Detail.getColumn(vn_Row, "EXPAMT");
                    var vn_Weight = this.ds_Detail.getColumn(vn_Row, "WEIGHT");
                    if (vn_Weight == null || vn_Weight == 0) vn_Weight = 1;
                    var vn_Temp = vn_Expamt * vn_Wrate / vn_Weight;
                    var vn_Wamt = this.gf_trunc(vn_Temp, 0);
                    this.ds_Detail.setColumn(vn_Row, "WAMT", vn_Wamt);
                    break;
                case 'URATE':
                    var vn_Urate = vs_Data;
                    var vn_Expamt = this.ds_Detail.getColumn(vn_Row, "EXPAMT");
                    var vn_Weight = this.ds_Detail.getColumn(vn_Row, "WEIGHT");
                    if (vn_Weight == null || vn_Weight == 0) vn_Weight = 1;
                    var vn_Temp = vn_Expamt * vn_Urate / vn_Weight;
                    var vn_Uamt = Math.round(vn_Temp, 2);
                    this.ds_Detail.setColumn(vn_Row, "UAMT", vn_Uamt);
                    break;
            }
            return;
        }
        else if (obj.id == 'ds_Detail_1') {
            switch (e.columnid) {
                case 'CINO':
                    if (NXCore.isEmpty(vs_Data) || vs_Data == '') {
                        return;
                    }
                    var vn_Rtn = this.ff_Selectcino(vs_Data, vn_Row);
                    if (vn_Rtn == -1) {
                        this.ds_Detail_1.setColumn(vn_Row, "CINO", '');
                        return;
                    }
                    break;

                case 'CHK':

                    var vn_Expamt = this.grd_Detail.getCellValue(-2, 5);
                    var vn_Wamt = this.grd_Detail.getCellValue(-2, 6);
                    var vn_Uamt = this.grd_Detail.getCellValue(-2, 7);
                    var vn_Fobamt = this.grd_Detail.getCellValue(-2, 8);
                    var vn_Fobamtw = this.grd_Detail.getCellValue(-2, 9);

                    this.ds_Detail.setColumn(0, "EXPAMT", vn_Expamt);
                    this.ds_Detail.setColumn(0, "WAMT", vn_Wamt);
                    this.ds_Detail.setColumn(0, "UAMT", vn_Uamt);
                    this.ds_Detail.setColumn(0, "FOBAMT", vn_Fobamt);
                    this.ds_Detail.setColumn(0, "FOBAMTW", vn_Fobamtw);
                    break;
            }
        }
    }
    else {
        //Object 별 처리 
        // 상위 Div 이름을 가져와서 각각처리 함.
        vs_Data = e.postvalue;
        if (obj.parent.name == 'div_Detail') {
            switch (obj.name) {
                case 'edt_Cvcodnm':
                    var vs_sql = " SELECT COUNT(*) AS CNT FROM VNDMST "
                    vs_sql += "  WHERE ( CVNAS LIKE '%'||UPPER('" + vs_Data + "')||'%' OR CVNAS2 LIKE '%'||UPPER('" + vs_Data + "')||'%') AND CVSTATUS = '0' ";

                    this.gf_SelectSql_sync("ds_Temp : " + vs_sql, "CVCOD_SELECT", "ff_Callback_sync");

                    if (this.ds_Temp.getColumn(0, "CNT") == 0) {
                        this.gf_message_chk("190", this.gf_get_trans_word("거래처명")); // 코드 오류 
                        this.ds_Detail.setColumn(0, "CVCOD", "");
                        this.ds_Detail.setColumn(0, "CVCODNM", "");
                        return;
                    }
                    else if (this.ds_Temp.getColumn(0, "CNT") == 1) {
                        vs_sql = " SELECT CVCOD, CVNAS FROM VNDMST "
                        vs_sql += "  WHERE ( CVNAS LIKE '%'||UPPER('" + vs_Data + "')||'%' OR CVNAS2 LIKE '%'||UPPER('" + vs_Data + "')||'%') AND CVSTATUS = '0' ";

                        this.gf_SelectSql_sync("ds_Temp : " + vs_sql, "CVCOD_SELECT", "ff_Callback_sync");

                        this.ds_Detail.setColumn(0, "CVCOD", this.ds_Temp.getColumn(0, "CVCOD"));
                        this.ds_Detail.setColumn(0, "CVCODNM", this.ds_Temp.getColumn(0, "CVNAS"));

                        /*var vs_event = new nexacro.ChangeEventInfo();

                        vs_event.newvalue = this.ds_Temp.getColumn(0,"CVCOD");

                        vs_event.columnid = "ARG_CVCOD";

                        vs_event.row = 0;

                        this.ff_Object_onitemchanged(this.ds_Detail,vs_event);*/

                    }
                    else if (this.ds_Temp.getColumn(0, "CNT") > 1) {
                        vs_Arg = '2' + "|" + '' + "|" + vs_Data + "|" + 'S' + "|" + this.ds_Head.getColumn(0, 'ARG_SAUPJ');
                        var resultForm = this.gf_showPopup("popup_edt_Cvcod", "co_popu::co_popu_vndmst_f.xfdl", { width: 10, height: 20 },
                            {
                                OpenRetv: 'Y',   // popup open 즉시 조회  
                                MultSelect: 'N',   // MULTI LINE 선택
                                Argument: vs_Arg  // 조회조건 파라메터 
                            }, { callback: "ff_AfterPopup" });
                    }


                    break;

                case 'edt_Gwvndnm':

                    var vs_sql = " SELECT COUNT(*) AS CNT FROM VNDMST "
                    vs_sql += "  WHERE ( CVNAS LIKE '%'||UPPER('" + vs_Data + "')||'%' OR CVNAS2 LIKE '%'||UPPER('" + vs_Data + "')||'%') AND CVSTATUS = '0' ";

                    this.gf_SelectSql_sync("ds_Temp : " + vs_sql, "CVCOD_SELECT", "ff_Callback_sync");

                    if (this.ds_Temp.getColumn(0, "CNT") == 0) {
                        this.gf_message_chk("190", this.gf_get_trans_word("거래처명")); // 코드 오류 
                        this.ds_Detail.setColumn(0, "GWVND", "");
                        this.ds_Detail.setColumn(0, "GWVNDNM", "");
                        return;
                    }
                    else if (this.ds_Temp.getColumn(0, "CNT") == 1) {
                        vs_sql = " SELECT CVCOD, CVNAS FROM VNDMST "
                        vs_sql += "  WHERE ( CVNAS LIKE '%'||UPPER('" + vs_Data + "')||'%' OR CVNAS2 LIKE '%'||UPPER('" + vs_Data + "')||'%') AND CVSTATUS = '0' ";

                        this.gf_SelectSql_sync("ds_Temp : " + vs_sql, "CVCOD_SELECT", "ff_Callback_sync");

                        this.ds_Detail.setColumn(0, "GWVND", this.ds_Temp.getColumn(0, "CVCOD"));
                        this.ds_Detail.setColumn(0, "GWVNDNM", this.ds_Temp.getColumn(0, "CVNAS"));

                        /*var vs_event = new nexacro.ChangeEventInfo();

                        vs_event.newvalue = this.ds_Temp.getColumn(0,"CVCOD");

                        vs_event.columnid = "ARG_CVCOD";

                        vs_event.row = 0;

                        this.ff_Object_onitemchanged(this.ds_Detail,vs_event);*/

                    }
                    else if (this.ds_Temp.getColumn(0, "CNT") > 1) {
                        vs_Arg = '1' + "|" + '' + "|" + vs_Data + "|" + '' + "|" + this.ds_Head.getColumn(0, 'ARG_SAUPJ');
                        var resultForm = this.gf_showPopup("popup_edt_Gwvnd", "co_popu::co_popu_vndmst_f.xfdl", { width: 10, height: 20 },
                            {
                                OpenRetv: 'Y',   // popup open 즉시 조회  
                                MultSelect: 'N',   // MULTI LINE 선택
                                Argument: vs_Arg  // 조회조건 파라메터 
                            }, { callback: "ff_AfterPopup" });
                    }


                    break;

                case 'edt_Exvndnm':

                    var vs_sql = " SELECT COUNT(*) AS CNT FROM VNDMST "
                    vs_sql += "  WHERE ( CVNAS LIKE '%'||UPPER('" + vs_Data + "')||'%' OR CVNAS2 LIKE '%'||UPPER('" + vs_Data + "')||'%') AND CVSTATUS = '0' ";

                    this.gf_SelectSql_sync("ds_Temp : " + vs_sql, "CVCOD_SELECT", "ff_Callback_sync");

                    if (this.ds_Temp.getColumn(0, "CNT") == 0) {
                        this.gf_message_chk("190", this.gf_get_trans_word("거래처명")); // 코드 오류 
                        this.ds_Detail.setColumn(0, "EXVND", "");
                        this.ds_Detail.setColumn(0, "EXVNDNM", "");
                        return;
                    }
                    else if (this.ds_Temp.getColumn(0, "CNT") == 1) {
                        vs_sql = " SELECT CVCOD, CVNAS FROM VNDMST "
                        vs_sql += "  WHERE ( CVNAS LIKE '%'||UPPER('" + vs_Data + "')||'%' OR CVNAS2 LIKE '%'||UPPER('" + vs_Data + "')||'%') AND CVSTATUS = '0' ";

                        this.gf_SelectSql_sync("ds_Temp : " + vs_sql, "CVCOD_SELECT", "ff_Callback_sync");

                        this.ds_Detail.setColumn(0, "EXVND", this.ds_Temp.getColumn(0, "CVCOD"));
                        this.ds_Detail.setColumn(0, "EXVNDNM", this.ds_Temp.getColumn(0, "CVNAS"));

                        /*var vs_event = new nexacro.ChangeEventInfo();

                        vs_event.newvalue = this.ds_Temp.getColumn(0,"CVCOD");

                        vs_event.columnid = "ARG_CVCOD";

                        vs_event.row = 0;

                        this.ff_Object_onitemchanged(this.ds_Detail,vs_event);*/

                    }
                    else if (this.ds_Temp.getColumn(0, "CNT") > 1) {
                        vs_Arg = '1' + "|" + '' + "|" + vs_Data + "|" + '' + "|" + this.ds_Head.getColumn(0, 'ARG_SAUPJ');
                        var resultForm = this.gf_showPopup("popup_edt_Exvnd", "co_popu::co_popu_vndmst_f.xfdl", { width: 10, height: 20 },
                            {
                                OpenRetv: 'Y',   // popup open 즉시 조회  
                                MultSelect: 'N',   // MULTI LINE 선택
                                Argument: vs_Arg  // 조회조건 파라메터 
                            }, { callback: "ff_AfterPopup" });
                    }


                    break;
            }
        }
    }
}

this.ff_Callback_sync = function (sSvcID, ErrorCode, ErrorMsg) {
    vi_ErrorCode = ErrorCode;     // 콜백루틴의 에러코드        싱크트란잭션일경우 사용
    vs_ErrorMsg = ErrorMsg;      //// 콜백루틴의 에러메세지    싱크트란잭션일경우 사용
    if (ErrorCode < 0) {
        NXCore.alert('CallBack SVCID = ' + sSvcID + '  ErrorCode = ' + ErrorCode + ' MSG = ' + ErrorMsg);
    }
    switch (sSvcID) {
        /*case "DELETE_SQL":
        case "DELETE_ALL_SQL" :
            if (this.ds_Detail.getRowType(0) == "0") 
            {
                this.gf_message_chk("140", ""); // 정상처리
            }
            else{
                this.ff_Tran("DELETE_ALL");
            }  
            break;*/
    }
}

// MOUSE LEFT BUTTON 처리 
// 해당 objectd의 이벤트에서 "ff_Object_onlbuttondown"로 추가 
this.ff_Object_onlbuttondown = function (obj: Grid, e: nexacro.GridMouseEventInfo) {
    if (obj.readonly) return;		//readonly 상태 이면 팝업 취소
    if (e.row < 0) return;

    // Grid과 다른 object로 나눠서 처리
    // obj가 Grid를 확인해서 처리함
    if (obj == '[object Grid]') {
        if (obj.id == 'grd_Detail') {
        }
    }
    else {
        if (obj.parent.name == 'div_Head') {
            return;
        }
        else if (obj.parent.name == 'div_Detail') {
            return;
        }
    }
}


// MOUSE RIGHT BUTTON 처리 
// 해당 objectd의 이벤트에서 "ff_Object_onrbuttondown"로 추가 
this.ff_Object_onrbuttondown = function (obj: Object, e: nexacro.MouseEventInfo) {
    var vs_Data = e.postvalue;
    var vs_Arg = '';

    if (obj.readonly) return;		//readonly 상태 이면 팝업 취소

    // Grid과 다른 object로 나눠서 처리
    // obj가 Grid를 확인해서 처리함
    if (obj == '[object Grid]') {
        if (obj.id == 'grd_Detail') {
            switch (this.gf_GetCellBind(obj, e.col, 'body')) {
                case 'CINO':
                    var vs_Expgu = this.ds_Detail.getColumn(0, "EXPGU");
                    var vs_Cvcod = this.ds_Detail.getColumn(0, "CVCOD");
                    var vs_Cvnas = this.ds_Detail.getColumn(0, "CVCODNM");
                    if (vs_Expgu == '2') {
                        vs_Arg = 'Y|A|Y';	// Local // 매출확정
                    }
                    else if (vs_Expgu == '4') {
                        vs_Arg = 'RETURNS|A|Y';
                    }
                    else {
                        vs_Arg = 'C|A|Y';	// Direct
                    }

                    vs_Arg = vs_Arg + '|' + vs_Cvcod + '|' + vs_Cvnas;
                    var resultForm = this.gf_showPopup("popup_cino", "co_popu::co_popu_expci_f.xfdl", { width: 10, height: 20 },
                        {
                            OpenRetv: 'Y',   // popup open 즉시 조회
                            MultSelect: 'N',   // MULTI LINE 선택
                            Argument: vs_Arg	// 조회조건 파라메터
                        }, { callback: "ff_AfterPopup" });
                    break;
            }
        }
    }
    else {
        if (obj.parent.name == 'div_Detail') {
            var vs_Row; 					//데이터셋의 row 위치값
            switch (obj.name) {
                case 'edt_Cvcod':
                    vs_Arg = '2' + "|" + '' + "|" + '' + "|" + 'S' + "|" + application.gvs_defsaupj;
                    var resultForm = this.gf_showPopup("popup_edt_Cvcod", "co_popu::co_popu_vndmst_f.xfdl", { width: 550, height: 700 },
                        {
                            OpenRetv: 'Y',   // popup open 즉시 조회
                            MultSelect: 'N',   // MULTI LINE 선택
                            Argument: vs_Arg  // 조회조건 파라메터 
                        }, { callback: "ff_AfterPopup" });
                    break;
                case 'edt_Exvnd':
                    vs_Arg = '1';
                    var resultForm = this.gf_showPopup("popup_edt_Exvnd", "co_popu::co_popu_vndmst_f.xfdl", { width: 550, height: 700 },
                        {
                            OpenRetv: 'Y',   // popup open 즉시 조회
                            MultSelect: 'N',   // MULTI LINE 선택
                            Argument: vs_Arg  // 조회조건 파라메터 
                        }, { callback: "ff_AfterPopup" });
                    break;
                case 'edt_Gwvnd':
                    vs_Arg = '1';
                    var resultForm = this.gf_showPopup("popup_edt_Gwvnd", "co_popu::co_popu_vndmst_f.xfdl", { width: 550, height: 700 },
                        {
                            OpenRetv: 'Y',   // popup open 즉시 조회
                            MultSelect: 'N',   // MULTI LINE 선택
                            Argument: vs_Arg  // 조회조건 파라메터 
                        }, { callback: "ff_AfterPopup" });
                    break;
                case 'edt_Explcno':
                    vs_Arg = '';
                    var resultForm = this.gf_showPopup("popup_edt_Explcno", "co_popu::co_popu_explc_f.xfdl", { width: 10, height: 20 },
                        {
                            OpenRetv: 'Y',   // popup open 즉시 조회  
                            MultSelect: 'N',   // MULTI LINE 선택
                            Argument: vs_Arg  // 조회조건 파라메터 
                        }, { callback: "ff_AfterPopup" });
                    break;
                case 'edt_Expno':
                    var vs_Cvcod = this.ds_Detail.getColumn(0, "CVCOD");
                    var vs_Cvcodnm = this.ds_Detail.getColumn(0, "CVCODNM");
                    vs_Arg = vs_Cvcod + '|' + vs_Cvcodnm;
                    var resultForm = this.gf_showPopup("popup_edt_Expno", "co_popu::co_popu_export_f.xfdl", { width: 10, height: 20 },
                        {
                            OpenRetv: 'Y',   // popup open 즉시 조회  
                            MultSelect: 'N',   // MULTI LINE 선택
                            Argument: vs_Arg  // 조회조건 파라메터 
                        }, { callback: "ff_AfterPopup" });
                    break;
            }
        }
    }
}

// pupup의 콜백함수 처리
this.ff_AfterPopup = function (strId, obj) {
    var va_Data = this.gf_popup_data(obj);  // popup 에서 넘어온 data 를 array 로 받아온다.

    if (va_Data == false) return;  // 자료 없음
    switch (strId) {
        // ff_Object_onrbuttondown 에서 this.gf_showPopup("id","","")  <-- 로 분류 하여 후처리
        case "popup_edt_Cvcod":
            for (var i = 0; i < va_Data.length; i++) {
                this.ds_Detail.setColumn(this.ds_Detail.rowposition, 'CVCOD', va_Data[i][0]);
                this.ds_Detail.setColumn(this.ds_Detail.rowposition, 'CVCODNM', va_Data[i][2]);
            }
            this.div_Detail.edt_Cvcod.setFocus();  // cursor set
            break;
        case "popup_edt_Exvnd":
            for (var i = 0; i < va_Data.length; i++) {
                this.ds_Detail.setColumn(this.ds_Detail.rowposition, 'EXVND', va_Data[i][0]);
                this.ds_Detail.setColumn(this.ds_Detail.rowposition, 'EXVNDNM', va_Data[i][2]);
            }
            this.div_Detail.edt_Exvnd.setFocus();  // cursor set
            break;
        case "popup_edt_Gwvnd":
            for (var i = 0; i < va_Data.length; i++) {
                this.ds_Detail.setColumn(this.ds_Detail.rowposition, 'GWVND', va_Data[i][0]);
                this.ds_Detail.setColumn(this.ds_Detail.rowposition, 'GWVNDNM', va_Data[i][2]);
            }
            this.div_Detail.edt_Exvnd.setFocus();  // cursor set
            break;
        case "popup_edt_Explcno":
            var vs_Lcno = '';
            for (var i = 0; i < va_Data.length; i++) {
                this.ds_Detail.setColumn(this.ds_Detail.rowposition, 'EXPLCNO', va_Data[i][0]);
                var vs_Lcno = va_Data[i][0];
            }
            this.ff_SelectLcno(vs_Lcno);
            break;
        case "popup_cino":
            var vs_Lcno = '';
            for (var i = 0; i < va_Data.length; i++) {
                this.ds_Detail_1.setColumn(this.ds_Detail_1.rowposition, 'CINO', va_Data[i][0]);
                var vs_Cino = va_Data[i][0];
            }
            // 			var vn_Rtn = this.ff_Selectcino(vs_Cino, this.ds_Detail_1.rowposition);
            // 			if(vn_Rtn == -1)
            // 			{
            // 				this.ds_Detail_1.setColumn(this.ds_Detail_1.rowposition, "CINO", '');
            // 				return;
            // 			}
            break;
        case "popup_edt_Expno":
            for (var i = 0; i < va_Data.length; i++) {
                this.ds_Detail.setColumn(this.ds_Detail.rowposition, 'EXPNO', va_Data[i][0]);
                var vs_Expno = va_Data[i][0];
            }
            this.div_Detail.edt_Expno.setFocus();  // cursor set
            //이벤트 처리 생략
            this.ds_Detail.set_enableevent(false);
            this.btn_query_onclick();
            //이벤트 처리
            this.ds_Detail.set_enableevent(true);
            break;
    }
}
/***********************************************************************
 * User created function specification
 ************************************************************************/

// 조건 체크 (필수 입력 항목 체크)
this.ff_required_chk = function (vs_Mode) {
    var vs_Gbn;
    var vs_Data, vs_Itcls;
    var i, vi_row, vi_len;
    // 공통 체크처리
    // 등록(I), 수정(M), 조회(R) 에서 필수 값 체크
    // 가능하면 HEAD, MASTER까지 모두 여기서 체크, 처리 해주세요.
    switch (vs_Mode) {
        //조회
        case "M":
            vs_Data = this.ds_Detail.getColumn(0, "EXPNO");
            if (NXCore.isEmpty(vs_Data)) {
                this.gf_message_chk("121295", "");	//NEGO번호를 입력하세요
                this.div_Detail.edt_Expno.setFocus();  // cursor set
                return false;
            }
            break;
        //입력 
        case "I":
            for (i = 0; i <= this.ds_Detail.rowcount - 1; i++) {
                var vs_Expgu = this.ds_Detail.getColumn(i, "EXPGU");
                if (NXCore.isEmpty(vs_Expgu)) {
                    this.gf_message_chk("200", this.gf_get_trans_word("수출구분"));
                    this.div_Detail.cal_Expgu.setFocus();  // cursor set
                    return false;
                }
                /*vs_Data = this.ds_Detail.getColumn(i, "EXPPMTNO");
                if (NXCore.isEmpty(vs_Data) && vs_Expgu == '1')	{
                    this.gf_message_chk("200", this.gf_get_trans_word("수출면장번호"));
                    this.div_Detail.edt_Exppmtno.setFocus();  // cursor set
                    return false;
                }
            	
                if(input_Mode == 'I') 
                {
                    var vs_Sql  = "SELECT COUNT(*) AS CNT FROM EXPORT "
                        vs_Sql += "  WHERE EXPPMTNO = '"+ vs_Data +"' ";
                    	
                    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql , "VNDMST_SELECT","ff_Callback_sync");
                	
                    if(this.ds_Temp.getColumn(0,"CNT") > 0)
                    {
                        this.gf_message_chk("102278", "");
                        this.div_Detail.edt_Exppmtno.setFocus();  // cursor set
                        return false;
                    }
                }*/

                vs_Data = this.ds_Detail.getColumn(i, "EXPDAT");
                if (NXCore.isEmpty(vs_Data)) {
                    this.gf_message_chk("200", this.gf_get_trans_word("수출일자"));
                    this.div_Detail.cal_Expdat.setFocus();  // cursor set
                    return false;
                }
                var vs_Curr = this.ds_Detail.getColumn(i, "CURR");
                if (NXCore.isEmpty(vs_Curr)) {
                    this.gf_message_chk("200", this.gf_get_trans_word("통화단위"));
                    this.div_Detail.cbo_Curr.setFocus();  // cursor set
                    return false;
                }
                vs_Data = this.ds_Detail.getColumn(i, "WRATE");
                if (NXCore.isEmpty(vs_Data)) {
                    this.gf_message_chk("200", this.gf_get_trans_word("기준환율"));
                    this.div_Detail.msk_Wrate.setFocus();  // cursor set
                    return false;
                }
                vs_Data = this.ds_Detail.getColumn(i, "URATE");
                if (NXCore.isEmpty(vs_Data)) {
                    this.gf_message_chk("200", this.gf_get_trans_word("대미환산율"));
                    this.div_Detail.msk_Urate.setFocus();  // cursor set
                    return false;
                }
                vs_Data = this.ds_Detail.getColumn(i, "CVCOD");
                if (NXCore.isEmpty(vs_Data)) {
                    this.gf_message_chk("200", this.gf_get_trans_word("Buyer"));
                    this.div_Detail.edt_Cvcod.setFocus();  // cursor set
                    return false;
                }
                var vn_Expamt = this.ds_Detail.getColumn(i, "EXPAMT");
                if (vn_Expamt == null) vn_Expamt = 0;
            }
            for (var k = 0; k <= this.ds_Detail_1.rowcount - 1; k++) {
                var vs_Dcurr = this.ds_Detail_1.getColumn(k, "CURR");
                if (vs_Curr != vs_Dcurr) {
                    this.gf_message_chk("103325", "");	//통화단위가 서로 틀립니다.
                    return false;
                }
            }
            var vs_Exppmtdt = this.ds_Detail.getColumn(0, "EXPPMTDT");
            var vn_Salecnf = this.ff_Salecnf(vs_Expgu);
            if (vn_Salecnf == '1') {
                if (NXCore.isEmpty(vs_Exppmtdt)) {
                    this.gf_message_chk("200", this.gf_get_trans_word("면장일자"));
                    this.div_Detail.cal_Exppmtdt.setFocus();  // cursor set
                    return false;
                }
            }
            break;
    }
    return true;
}

// Transaction 처리
this.ff_Tran = function (strSvcId) {
    switch (strSvcId) {
        case "SELECT_DETAIL":
            this.ds_Detail.set_enableevent(false);
            // 넘겨줄 파라메터 셋팅
            v_SvcAct = "em/ship/em_ship_export_e_1q.jsp";
            v_OutDataset = "ds_Detail=output1";	// 반드시 output1으로 기술할 것
            v_InDataset = "ds_para=ds_Head";	// 반드시 기술할 것
            v_Argument = "";
            break;
        case "SELECT_DETAIL_1":
            this.ds_Detail_1.set_enableevent(false);		//이벤트 처리 생략
            // 넘겨줄 파라메터 셋팅
            v_SvcAct = "em/ship/em_ship_export_e_2q.jsp";
            v_OutDataset = "ds_Detail_1=output1";	// 반드시 output1으로 기술할 것
            v_InDataset = "ds_para=ds_Head";	// 반드시 기술할 것
            v_Argument = "";
            break;
        case "SAVE_ALL":
            v_SvcAct = "em/ship/em_ship_export_e_1tr.jsp";
            v_InDataset = "input1=ds_Detail:U";	//반드시 input1으로 기술할것
            v_OutDataset = "";
            break;
        case "DELETE_ALL":
            v_SvcAct = "em/ship/em_ship_export_e_1tr.jsp";
            v_InDataset = "input1=ds_Detail:U";	//반드시 input1으로 기술할것
            v_OutDataset = "";
            break;

        case "SAVE_HIDE":
            v_SvcAct = "em/ship/em_ship_export_e_3tr.jsp";
            v_InDataset = "input1=ds_Hide:U";	//반드시 input1으로 기술할것
            v_OutDataset = "";
            break;
    }
    this.gf_Transaction_Async(strSvcId, v_SvcAct, v_InDataset, v_OutDataset, "ff_Callback");
}

// 콜백 함수 처리 
this.ff_Callback = function (sSvcID, ErrorCode, ErrorMsg) {
    if (ErrorCode < 0) {
        NXCore.alert('CallBack ERR = ' + ErrorMsg);
        return;
    }
    switch (sSvcID) {
        case "SELECT_DETAIL":
            this.ds_Detail.set_enableevent(true);
            //trace(this.ds_Head.saveXML());
            if (this.ds_Detail.rowcount < 1) {
                this.gf_message_chk("110", ""); // 조회 및 출력할 자료가 없습니다.
                return;
            }
            //조회 되면서 송장/비용 조회
            this.ff_Tran("SELECT_DETAIL_1");
            var vs_Expno = this.ds_Detail.getColumn(0, "EXPNO");
            var vn_Row = this.ds_Detail_1.rowcount;
            //this.ds_Detail.set_enableevent(false);		//이벤트 처리 생략
            this.div_Detail.edt_Expno.set_readonly(true);
            //this.ds_Detail.set_enableevent(true);		//이벤트 처리
            break;
        case "SELECT_DETAIL_1":
            this.ds_Detail_1.set_enableevent(true);		//이벤트 처리 생략
            //trace(this.ds_Head.saveXML());
            // 			if (this.ds_Detail_1.rowcount < 1)
            // 			{
            // 				this.gf_message_chk("110", ""); // 조회 및 출력할 자료가 없습니다.
            // 				return;
            // 			}
            // 			var vs_Expno = this.ds_Detail.getColumn( 0, "EXPNO");
            // 			var vn_Row = this.ds_Detail_1.rowcount;
            break;
        case "SAVE_ALL":

            if (!NXCore.isEmpty(pvs_Update_sql) && pvs_Update_sql != '') {
                this.gf_UpdateSql_sync(pvs_Update_sql, 'UPDATE_SQL', "ff_Callback_sync", 0);
            }
            this.gf_message_chk("140", "저장완료", "정상적으로 자료가 저장되었습니다.");
            //var vs_Expno = this.ds_Detail.getColumn(this.ds_Detail.rowposition, "EXPNO");
            //this.ff_input_mode_change('I');
            //this.ds_Detail.setColumn(0, "EXPNO", vs_Expno);
            //this.btn_query_onclick();
            break;
        case "DELETE_ALL":
            this.gf_message_chk("140", ""); // 정상처리
            this.ff_input_mode_change('I');
            this.btn_cancel_onclick();
            break;
    }
}

// 입력모드 선택시 처리
this.ff_input_mode_change = function (sMode) {
    if (sMode == "I")
        this.div_Input_Mode.btn_Input_onclick();	//입력모드로 초기화
    else
        this.div_Input_Mode.btn_Modify_onclick();	//입력모드로 초기화
}

this.ff_SelectLcno = function (vLcno) {
    var vs_Sql = '';
    var vn_Row = this.ds_Detail.rowposition;
    if (NXCore.isEmpty(vLcno) || vLcno == '') {
        return;
    }
    vs_Sql = " SELECT EXPLCNO, BANKLCNO, LCAMT, CVCOD, FUN_GET_CVNAS(CVCOD) AS CVCODNM, CURR "
    vs_Sql += " FROM EXPLC "
    vs_Sql += " WHERE EXPLCNO = '" + vLcno + "' ";
    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "LCNO_SELECT", "ff_Callback_sync");
    if (this.ds_Temp.rowcount == 0) {
        this.ds_Detail.setColumn(vn_Row, "EXPLCNO", "");
        this.ds_Detail.setColumn(vn_Row, "LCAMT", 0);
        return;
    }
    else {
        this.ds_Detail.setColumn(vn_Row, "EXPLCNO", this.ds_Temp.getColumn(0, "EXPLCNO"));
        this.ds_Detail.setColumn(vn_Row, "LCAMT", this.ds_Temp.getColumn(0, "LCAMT"));
    }
}

this.ff_Curr = function (vs_Date, vs_Curr, vs_Row) {
    this.ds_Detail.set_enableevent(false);

    var vs_Sql = '';
    var vn_Row = this.ds_Detail.rowposition;
    if (NXCore.isEmpty(vs_Curr) || vs_Curr == '') {
        this.ds_Detail.set_enableevent(true);
        return;
    }
    vs_Sql = " SELECT X.RSTAN, X.USDRAT, Y.RFNA2 "
    vs_Sql += " FROM RATEMT X, REFFPF Y "
    vs_Sql += " WHERE X.RCURR = Y.RFGUB(+) AND Y.RFCOD = '10' AND X.RDATE = '" + vs_Date + "' AND X.RCURR = '" + vs_Curr + "' ";
    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "CURR_SELECT", "ff_Callback_sync");

    if (this.ds_Temp.rowcount == 0) {
        var vn_Wrate = 1;
        var vn_Weight = 1;
        var vn_Urate = 1;
    }
    else {
        var vn_Wrate = this.ds_Temp.getColumn(0, "RSTAN");
        var vn_Weight = this.ds_Temp.getColumn(0, "RFNA2");
        var vn_Urate = this.ds_Temp.getColumn(0, "USDRAT");
    }
    this.ds_Detail.setColumn(vn_Row, "WRATE", vn_Wrate);
    this.ds_Detail.setColumn(vn_Row, "URATE", vn_Urate);
    this.ds_Detail.setColumn(vn_Row, "WEIGHT", vn_Weight);

    var vn_Expamt = this.ds_Detail.getColumn(vn_Row, "EXPAMT");
    if (vn_Expamt == null) vn_Expamt = 0;
    if (vn_Weight == null) vn_Weight = 1;
    if (vn_Wrate == null) vn_Wrate = 1;
    if (vn_Urate == null) vn_Urate = 1;

    var vn_Wamt = vn_Expamt * vn_Wrate / vn_Weight;
    var vn_Uamt = vn_Expamt * vn_Urate / vn_Weight;

    this.ds_Detail.setColumn(vn_Row, "WAMT", this.gf_trunc(vn_Wamt, 0));
    this.ds_Detail.setColumn(vn_Row, "UAMT", this.gf_trunc(vn_Uamt, 2));

    var detailSum = 0; //** 문석추가 끝전 처리를 위한 변수

    for (var i = 0; i <= this.ds_Detail_1.rowcount - 1; i++) {
        var vn_Expamt2 = this.ds_Detail_1.getColumn(i, "EXPAMT");

        var vn_Wamt2 = vn_Expamt2 * vn_Wrate / vn_Weight;
        var vn_Uamt2 = vn_Expamt2 * vn_Urate / vn_Weight;

        this.ds_Detail_1.setColumn(i, "WAMT", this.gf_trunc(vn_Wamt2, 0));
        this.ds_Detail_1.setColumn(i, "UAMT", this.gf_trunc(vn_Uamt2, 2));

        detailSum += this.gf_trunc(vn_Wamt2, 0); //** 문석추가 끝전 처리를 위한 코드
    }

    //	this.ds_Detail_1.setColumn(this.ds_Detail_1.rowcount - 1, "WAMT", 
    //		this.ds_Detail_1.getColumn(this.ds_Detail_1.rowcount - 1, "WAMT") - (detailSum - this.gf_trunc(vn_Wamt,0))); //** 문석추가 끝전 처리를 위한 코드

    this.ds_Detail.set_enableevent(true);
    return 0;
}

this.ff_Selectcino = function (vs_Cino, vn_Row) {
    var vs_Sql = " SELECT CINO, fun_get_cvnas(CVCOD) as cvnas, EXPNO, EXPAMT, CURR as cur, WAMT, UAMT, "
    vs_Sql += "        NVL(LOCALYN,'N') as localyn, CISTS, CURR, OUTCFDT, WRATE, URATE, FOBAMT, FOBAMTW, SALEDT "
    vs_Sql += " FROM EXPCIH  WHERE CINO = '" + vs_Cino + "' ";
    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "CINO_SELECT", "ff_Callback_sync");
    if (this.ds_Temp.rowcount == 0) {
        this.gf_message_chk("100870", "");	//등록되지 않은 C/I NO. 입니다.
        return -1;
    }
    var vs_Cino = this.ds_Temp.getColumn(0, "CINO");		//1
    var vs_Cvnas = this.ds_Temp.getColumn(0, "CVNAS");
    var vs_Expno = this.ds_Temp.getColumn(0, "EXPNO");
    var vn_Expamt = this.ds_Temp.getColumn(0, "EXPAMT");
    var vs_Cur = this.ds_Temp.getColumn(0, "CUR");
    var vn_Wamt = this.ds_Temp.getColumn(0, "WAMT");
    var vn_Uamt = this.ds_Temp.getColumn(0, "UAMT");
    var vs_Localyn = this.ds_Temp.getColumn(0, "LOCALYN");
    var vs_Cists = this.ds_Temp.getColumn(0, "CISTS");
    var vs_Curr = this.ds_Temp.getColumn(0, "CURR");
    var vs_Outcfdt = this.ds_Temp.getColumn(0, "OUTCFDT");	//11
    var vn_Wrate = this.ds_Temp.getColumn(0, "WRATE");
    var vn_Urate = this.ds_Temp.getColumn(0, "URATE");
    var vn_Fobamt = this.ds_Temp.getColumn(0, "FOBAMT");
    var vn_Fobamtw = this.ds_Temp.getColumn(0, "FOBAMTW");
    var vs_Saledt = this.ds_Temp.getColumn(0, "SALEDT");
    //세금계산서일 경우 Local Invoice만 가능
    var vs_Expgu = this.ds_Detail.getColumn(0, "EXPGU");
    if (vs_Expgu == '2' && (vs_Localyn == 'N' || vs_Cists == '1')) {
        this.gf_message_chk("100122", "");	//Local Invoice가 아니거나 출고확정되지 않았습니다.
        return -1;
    }
    var vn_Salecnf = this.ff_Salecnf(vs_Expgu);
    //면장일 경우 출고확정 자료만 가능

    if (vn_Salecnf == '1' && (vs_Outcfdt == null || vs_Outcfdt == '')) {
        this.gf_message_chk("103260", "");	//출고확정되지 않은 자료입니다.
        return -1;
    }
    if (vs_Expno != null && vs_Expno != '') {
        this.gf_message_chk("102278", vs_Expno);	//이미사용된 수출면장 번호가 존재합니다. 면장번호:
        return -1;
    }
    if (vn_Expamt == null || vn_Expamt == 0) {
        this.gf_message_chk("101778", "");	//수출금액이 없습니다.\nC/I수출금액을 확인하십시요
        return -1;
    }
    this.ds_Detail_1.setColumn(vn_Row, "CINO", vs_Cino);
    this.ds_Detail_1.setColumn(vn_Row, "CVCODNM", vs_Cvnas);
    this.ds_Detail_1.setColumn(vn_Row, "CURR", vs_Cur);
    this.ds_Detail_1.setColumn(vn_Row, "EXPAMT", vn_Expamt);
    this.ds_Detail_1.setColumn(vn_Row, "FOBAMT", vn_Fobamt);
    this.ds_Detail_1.setColumn(vn_Row, "FOBAMTW", vn_Fobamtw);
    this.ds_Detail_1.setColumn(vn_Row, "SALEDT", vs_Saledt);
    //반품처리시 환율은 매출환율로 계산
    if (vs_Expgu != '4') {
        var vn_Wrate = this.ds_Detail.getColumn(0, "WRATE");
        var vn_Urate = this.ds_Detail.getColumn(0, "URATE");
    }
    var vn_Weight = this.ds_Detail.getColumn(0, "WEIGHT");
    if (vn_Wrate == null || vn_Wrate == 0) vn_Wrate = 1;
    if (vn_Urate == null || vn_Urate == 0) vn_Urate = 1;
    if (vn_Weight == null || vn_Weight == 0) vn_Weight = 1;
    //CI의 원화금액,미화금액이 없을경우 (매출확정전) 면장환율로 계산한다
    if (vn_Wamt == null || vn_Wamt == 0) {
        var vn_Wamt = vn_Expamt * vn_Wrate / vn_Weight;
        vn_Wamt = this.gf_trunc(vn_Wamt, 0);
    }
    if (vn_Uamt == null || vn_Uamt == 0) {
        var vn_Uamt = vn_Expamt * vn_Urate / vn_Weight;
        vn_Uamt = this.gf_trunc(vn_Uamt, 2);
    }
    this.ds_Detail_1.setColumn(vn_Row, "WAMT", vn_Wamt);
    this.ds_Detail_1.setColumn(vn_Row, "UAMT", vn_Uamt);
    if (vs_Expgu == '4') {
        this.ds_Detail_1.setColumn(vn_Row, "WRATE", vn_Wrate);
        this.ds_Detail_1.setColumn(vn_Row, "URATE", vn_Urate);
        this.ds_Detail_1.setColumn(vn_Row, "WAMT", vn_Wamt);
        this.ds_Detail_1.setColumn(vn_Row, "UAMT", vn_Uamt);
    }
    //SetRowStatus(vDw, nRow, 0);
    this.ds_Detail.setRowType(0, "1");
    //return 1;
}

this.ff_Salecnf = function (vs_Expgu) {
    //매출확정일 여부 (1:면장,2:출고,3:b/l,4:임의)
    if (vs_Expgu == '2') {
        //Local일 경우
        var vs_Sql = " SELECT substr(dataname, 1, 1) as cd1 FROM syscnfg WHERE sysgu = 'S' AND serial = 8 AND lineno = 15 ";
    }
    else {
        var vs_Sql = " SELECT substr(dataname, 1, 1) as cd1 FROM syscnfg WHERE sysgu = 'S' AND serial = 8 AND lineno = 10 ";
    }
    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SYSCNFG_SELECT", "ff_Callback_sync");
    if (this.ds_Temp.rowcount == 0) {
        return -1;
    }
    var vs_Syscnfg = this.ds_Temp.getColumn(0, "CD1");
    return vs_Syscnfg;
}

this.ff_Updatefob = function () {
    var vn_FobAmt, vn_FobAmtW, vn_SumAmt, vn_SumAmtWd, vn_SumAmtd, vn_SumTotamt, vn_FobAmtd, vn_FobAmtWd;
    var vn_Uamt, vn_DivRate;
    //배분할 FOB금액
    vn_FobAmt = this.ds_Detail.getColumn(0, "FOBAMT");
    vn_FobAmtW = this.ds_Detail.getColumn(0, "FOBAMTW");

    if (vn_FobAmt == null) vn_FobAmt = 0;
    if (vn_FobAmtW == null) vn_FobAmtW = 0;
    vn_SumAmtd = 0;
    vn_SumAmtWd = 0;
    var vn_SumTotamt = 0;
    var vn_SumTotamtw = 0;
    var vn_Row = this.ds_Detail_1.rowcount;
    for (var i = 0; i <= this.ds_Detail_1.rowcount - 1; i++) {
        vn_SumTotamt = vn_SumTotamt + this.ds_Detail_1.getColumn(i, "UAMT");
        vn_SumTotamtw = vn_SumTotamtw + this.ds_Detail_1.getColumn(i, "WAMT");
    }
    for (var i = 0; i <= this.ds_Detail_1.rowcount - 1; i++) {
        vn_Uamt = this.ds_Detail_1.getColumn(i, "UAMT");
        if (vn_Uamt == null || vn_Uamt == 0) {
            vn_Fobamtd = 0;
            vn_FobamtWd = 0;
        }
        else {	//수출비용 배분율 계산
            vn_DivRate = vn_Uamt / vn_SumTotamt;
            //배분된 금액
            vn_FobAmtWd = vn_FobAmtW * vn_DivRate;	//원화
            vn_FobAmtWd = Math.round(vn_FobAmtWd, 2);
            vn_SumAmtWd = vn_SumAmtWd + vn_FobAmtWd;

            vn_FobAmtd = vn_FobAmt + vn_DivRate;	//미화
            vn_FobAmtd = Math.round(vn_FobAmtd, 2);
            vn_SumAmtd = vn_SumAmtd + vn_FobAmtd;
            //끝전 처리
            if (i == this.ds_Detail_1.rowcount - 1) {
                var vn_Temp = vn_FobAmtW - vn_SumAmtWd;
                vn_FobAmtWd = vn_FobAmtWd + Math.round(vn_Temp, 2);
                var vn_Temp2 = vn_FobAmt - vn_SumAmtd;
                vn_FobAmtd = vn_FobAmtd + Math.round(vn_Temp2, 2);
            }
        }
        this.ds_Detail_1.setColumn(i, "FOBAMT", vn_FobAmtd);
        this.ds_Detail_1.setColumn(i, "FOBAMTW", vn_FobAmtWd);
    }
    return 0;
}

this.ff_CreateSaleh = function () {
    var vFrdate, vCvcod_temp, vExpgu, vCvcod;
    var vSaleCnf, vItm;
    var vSql;
    var vRetvnd;
    var vRet1, vRet2;

    //----------------------------------------------
    //// 세금계산서를 발행 한다.
    //----------------------------------------------

    vFrdate = this.ds_Detail.getColumn(0, "EXPPMTDT");
    vCvcod_temp = this.ds_Detail.getColumn(0, "CVCOD");
    vExpgu = this.ds_Detail.getColumn(0, "EXPGU");

    if (application.confirm("세금계산서가 발행됩니다.\n발행 하시겠습니까?") == false) {
        return;
    }

    vSaleCnf = this.ff_Salecnf("2");

    //----------------------------------------------------
    //// 실적거래처 구하기....
    //----------------------------------------------------

    vRetvnd = this.gf_SelectSql_sync("ds_Temp: SELECT A.CVCOD,     "
        + "        B.SALESCOD   "
        + " FROM VNDMST	A,      "
        + "      VNDMST_SUB B   "
        + " WHERE A.CVCOD = B.CVCOD "
        + "   AND A.CVCOD = '" + vCvcod_temp + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

    if (vRetvnd[0] == 0) {
        vCvcod = vCvcod_temp;
    }
    else {
        vCvcod = vRetvnd[2];
    }

    //--------------------------------------------------------
    //// 전자세금계산서 부가 정보 check...(2012.05.09 추가)
    //--------------------------------------------------------
    var vVndchk = this.gf_SelectSql_sync("ds_Temp: SELECT nvl(count(*), 0), "
        + "        max(BILL_NM),     "
        + "        max(BILL_EMAIL)   "
        + " FROM VNDMST_SUB_BILL     "
        + " WHERE CVCOD = '" + vCvcod + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

    if (vVndchk[1] == "0" || NXCore.isEmpty(vVndchk[2]) || NXCore.isEmpty(vVndchk[3])) {
        alert("세금계산서 부가정보가 없습니다..\n거래처 정보 세금계산서 부가정보를 저장하고 확인하세요");
        return -1;
    }

    //--------------------------------------------------------
    //// Agent 정보 확인
    //--------------------------------------------------------

    vRet1 = this.gf_SelectSql_sync("ds_Temp: SELECT CVNAS,     "
        + "        SANO,      "
        + "        UPTAE,     "
        + "        JONGK,     "
        + "        OWNAM,     "
        + "        RESIDENT,  "
        + "        nvl(ADDR1, ' ') || nvl(ADDR2, ' '), "
        + "        CVGU	      "
        + " FROM VNDMST	      "
        + " WHERE CVCOD = '" + vCvcod + "'  ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

    //--------------------------------------------------------
    //// 세금계산서의 거래처정보 미등록시 제외
    //--------------------------------------------------------
    if ((NXCore.isEmpty(vRet1[2]) || vRet1[2] == "") && (NXCore.isEmpty(vRet1[6]) || vRet1[6] == "")) {
        alert("거래처 " + vCvcod + " 의 사업자번호 또는 주민번호정보 미비로 발행되지 않은 거래처입니다.");
        return -1;
    }

    //--------------------------------------------------------
    //--------------------------------------------------------
    if ((NXCore.isEmpty(vRet1[1]) || vRet1[1] == "") || (NXCore.isEmpty(vRet1[3]) || vRet1[3] == "") || (NXCore.isEmpty(vRet1[4]) || vRet1[4] == "") || (NXCore.isEmpty(vRet1[7]) || vRet1[7] == "")) {
        alert("거래처 " + vRet[1] + "의 거래처명,업태,업종,주소정보 미비로 발행되지 않은 거래처입니다.");
        return -1;
    }

    //--------------------------------------------------------
    //// 전표번호 채번
    //--------------------------------------------------------
    var vJunpyoseq = '';

    vJunpyoseq = parseFloat(this.gf_get_junpyo(vFrdate, "G0"));

    if (vJunpyoseq <= 0) {
        alert("전표채번을 실패했습니다.");
        return -1;
    }

    var vCheckno;
    var nMaxNo;

    //--------------------------------------
    //// 계산서 일련번호 채번
    //--------------------------------------
    nMaxNo = parseFloat(this.gf_get_junpyo(vFrdate.substr(0, 6), "G2"));

    if (nMaxNo <= 0) {
        alert("전표채번을 실패했습니다.");
        return -1;
    }

    //--------------------------------------
    //--------------------------------------
    vCheckno = vFrdate.substr(0, 6) + this.gf_NumToStr(nMaxNo, 4);

    var nRow = this.ds_Hide.addRow();

    this.ds_Hide.setColumn(nRow, "SALEDT", vFrdate);
    this.ds_Hide.setColumn(nRow, "SALENO", vJunpyoseq);

    this.ds_Hide.setColumn(nRow, "CHECKNO", vCheckno);

    this.ds_Hide.setColumn(nRow, "CVCOD", vCvcod);
    this.ds_Hide.setColumn(nRow, "SALECOD", vCvcod);

    this.ds_Hide.setColumn(nRow, "CVNAS", vRet1[1]);

    this.ds_Hide.setColumn(nRow, "SANO", vRet1[2]);
    this.ds_Hide.setColumn(nRow, "OWNAM", vRet1[5]);
    this.ds_Hide.setColumn(nRow, "RESIDENT", vRet1[6]);
    this.ds_Hide.setColumn(nRow, "UPTAE", vRet1[3]);
    this.ds_Hide.setColumn(nRow, "JONGK", vRet1[4]);
    this.ds_Hide.setColumn(nRow, "ADDR1", vRet1[7]);

    this.ds_Hide.setColumn(nRow, "AUTOBAL_YN", 'M');
    this.ds_Hide.setColumn(nRow, "EXPGU", '2');
    this.ds_Hide.setColumn(nRow, "TAX_NO", '24');

    this.ds_Hide.setColumn(nRow, "VATGBN", '101');

    this.ds_Hide.setColumn(nRow, "LCNO", this.ds_Detail.getColumn(0, "EXPLCNO"));

    //// 영세율 원화일경우
    if (this.ds_Detail.getColumn(0, "CURR") == 'KRW')   //// 자국의 통화일 경우
    {
        this.ds_Hide.setColumn(nRow, "FOR_AMT", 0);
    }
    else {
        this.ds_Hide.setColumn(nRow, "FOR_AMT", this.ds_Detail.getColumn(0, "EXPAMT"));
    }

    this.ds_Hide.setColumn(nRow, "EXCHRATE", this.ds_Detail.getColumn(0, "WRATE"));

    var vSaupj, vCino;
    var nGonamt = 0, nVatamt = 0;

    nGonamt = this.ds_Detail.getColumn(0, "WAMT");  //// 공µµ급가액

    //--------------------------------------------------------
    //// 품목
    //--------------------------------------------------------
    vSaupj = this.ds_Detail.getColumn(0, "SAUPJ");
    vCino = this.ds_Detail_1.getColumn(0, "CINO");

    //--------------------------------------------------------------
    //// 2009.2.6 품번나오게 수정
    //--------------------------------------------------------------
    var vPum = this.gf_SelectSql_sync("ds_Temp: SELECT FUN_GET_ITNCT(C.ITTYP, SUBSTR(C.ITCLS, 1, 2)) as PUM  "
        + " FROM EXPCID A,                       "
        + "      SORDER B,                       "
        + "      ITEMAS C                        "
        + " WHERE A.CINO     = '" + vCino + "'   "
        + "   AND A.ORDER_NO = B.ORDER_NO        "
        + "   AND B.ITNBR    = C.ITNBR	         "
        + "   AND ROWNUM     = 1  ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

    var nTotal = 0;
    var i = 0, nRowCnt = 0, nCnt = 0;
    var vTotQty = 0;
    var vCnt, vTemp;

    nRowCnt = this.ds_Detail_1.rowcount;

    for (i = 0; i <= nRowCnt - 1; i++) {
        vCino = this.ds_Detail_1.getColumn(i, "CINO");

        vCnt = this.gf_SelectSql_sync("ds_Temp: SELECT nvl(count(*), 0) "
            + " FROM EXPCID             "
            + " WHERE CINO = '" + vCino + "'  ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

        if (vCnt[0] == 0) {
            nCnt = 0;
        }
        else {
            nCnt = new Number(vCnt[1]);
        }

        nTotal = nTotal + nCnt;

        this.ds_Detail_1.setColumn(i, "CHECKNO", vCheckno);

        if (vSaleCnf == "1" && vExpgu != "4")  //// 반품계산서는 제외
        {
            this.ds_Detail_1.setColumn(i, "SALEDT", vFrdate);
        }


        var vSql = " UPDATE IMHIST_SAL "
            + "    SET CHECKNO = '" + vCheckno + "', "
            + "        YEBI4   = '" + vFrdate + "'  "
            + " WHERE INV_NO = '" + vCino + "' ";

        //this.gf_UpdateSql_sync(vSql, 'UPDATE_SQL',"ff_Callback_sync", 0); 


        vTemp = this.gf_SelectSql_sync("ds_Temp: SELECT nvl(sum(CIQTY), 0)    "
            + " FROM EXPCID                  "
            + " WHERE CINO = '" + vCino + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);


        vTotQty = vTotQty + new Number(vTemp[1]);
    }

    vItm = vPum[1] + " 외 " + (nTotal - 1);

    this.ds_Hide.setColumn(nRow, "SAUPJ", vSaupj);
    this.ds_Hide.setColumn(nRow, "GON_AMT", nGonamt);
    this.ds_Hide.setColumn(nRow, "VAT_AMT", nVatamt);

    this.ds_Hide.setColumn(nRow, "MMDD1", vFrdate.substr(6, 2));
    this.ds_Hide.setColumn(nRow, "PUM1", vItm);
    this.ds_Hide.setColumn(nRow, "GONAMT1", nGonamt);
    this.ds_Hide.setColumn(nRow, "VATAMT1", nVatamt);

    this.ds_Hide.setColumn(nRow, "CHYSGU", '0');
    this.ds_Hide.setColumn(nRow, "SALEGU", '3');
    this.ds_Hide.setColumn(nRow, "TAXBILL", 'N');

    this.ds_Hide.setColumn(nRow, "BILL_NM", vVndchk[2]);
    this.ds_Hide.setColumn(nRow, "BILL_EMAIL", vVndchk[3]);

    this.ff_Tran("SAVE_ALL");
    this.ff_Tran("SAVE_HIDE");

    this.gf_UpdateSql_sync(vSql, 'UPDATE_SQL', "ff_Callback_sync", 0);

    /*if (!confirm("세금계산서를 출력하시겠습니까?"))
    {
        return 1;
    }

    var vArgs = vCheckno + "|" + vSaupj;

    AddRetrieve(Form1.dwPrint, vArgs);
    DwRetrieve();

    if (Form1.dwPrint.RowCount() <= 0)
    {
        alert("출력 할 자료가 없습니다.");
        return 1;
    }

    Form1.dwPrint.Print(false);*/

    return 1;
}