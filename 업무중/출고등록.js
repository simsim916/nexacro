/***********************************************************************
 * 01. Creation date      : 2015.08.20
 * 02. Created by         : 원현욱
 * 03. Revision history   : 
 ************************************************************************/

/*************************************************************************************************************
* 프로그램 필수 
*************************************************************************************************************/
include "lib::common_form.xjs";


//item changed를 통해 쿼리가 변경 될 경우 사용, 아닐경우 ff_Tran()에서 직접 입력
var pvs_SvcAct, pvs_Save_SvcAct;
var pvs_OutDataset, pvs_InDataset, pvs_Save_OutDataset, pvs_Save_InDataset;
var pvs_Detail_SvcAct, pvs_Detail_OutDataset, pvs_Detail_InDataset;
var pvs_SysChk;
var input_Mode;
this.vi_ErrorCode = undefined;     // 콜백루틴의 에러코드        싱크트란잭션일경우 사용
this.vs_ErrorMsg = undefined;      //// 콜백루틴의 에러메세지    싱크트란잭션일경우 사용
var pvs_Mode;					// 등록, 삭제모드 


var vs_Sudate, vs_Cunit, vs_Salecnf;
var vs_Deptno, vs_Cists, vs_Outdate;
var vs_Saledate, vs_Expno;
var vs_Cino;
var vs_Sql;
var vn_Wrate, vn_Urate;

var fvs_9x;		// 1:절사,2:반올림
var fvn_9y;		// 위치지정(-1:십단위,0:원단위,1:소수점1자리,2:소수점2자리)
var fvn_9z;		// 부가세(증치세)

// on load event  페이지가 열릴때
this.form_onload = function (obj: Form, e: nexacro.LoadEventInfo) {
    this.gf_formOnload(obj);
    this.ff_load(obj);
}
//  초기 작업 수행
this.ff_load = function (obj) {
    pvs_SysChk = this.gf_Getsyscnfg('S', 11, '1');
    this.ff_SetCondition();   // 초기 조건 파라메터 셋팅밍 콤보 셋팅
}

// 초기 조건 파라메터 셋팅밍 콤보 셋팅
this.ff_SetCondition = function () {

    pvs_Mode = 'I';

    this.ff_form_init(pvs_Mode);

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

    if (NXCore.isModified(this.ds_Detail)) {
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
    this.ff_input_mode('I');
}

/*************************************************************************************************************
* 입력 프로그램 필수 끝
*************************************************************************************************************/
// 입력모드 선택시 처리
// 입력모드 선택시 처리
this.ff_input_mode = function (sMode) {
    var vs_Today = this.gf_today();

    vs_OpenRetv = this.parent.parent.fvs_OpenRetv;    // 넘어온 파라메터 값 
    vs_MultSelect = this.parent.parent.fvs_MultSelect;    // 넘어온 파라메터 값 
    vs_Argument = this.parent.parent.fvs_Argument;    // 넘어온 파라메터 값

    input_Mode = sMode;

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
        if (pvs_SysChk == 'Y') {
            pvs_SvcAct = "em/ship/em_ship_expout_e_2q.jsp";
            pvs_OutDataset = "ds_List=output1";  // 반드시 output1으로 기술할것		   
            this.grd_List.setFormat("list_Form00");
        }
        else {
            pvs_SvcAct = "em/ship/em_ship_expout_e_1q.jsp";
            pvs_OutDataset = "ds_List=output1";  // 반드시 output1으로 기술할것		   
            this.grd_List.setFormat("list_Form01")
        }
        this.grd_Detail.setFormat("detail_Form00");
        this.div_Head.sta_Date.set_visible(false);
        this.div_Head.cal_Edate.set_visible(false);
        pvs_InDataset = "ds_para=ds_Head";

    }
    else {

        pvs_SvcAct = "em/ship/em_ship_expout_e_3q.jsp";
        pvs_OutDataset = "ds_List=output1";  // 반드시 output1으로 기술할것		   

        this.grd_List.setFormat("list_Form02");
        this.grd_Detail.setFormat("detail_Form01");
        this.div_Head.sta_Date.set_visible(true);
        this.div_Head.cal_Edate.set_visible(true);
        pvs_InDataset = "ds_para=ds_Head";

    }
    this.ds_Head.clearData();
    this.ds_Detail.clearData();
    this.ds_List.clearData();
    this.ds_Head.addRow();

    this.gf_combo_head_sync(this.ds_Head, "ARG_SAUPJ", this.div_Head.cbo_Saupj, "co_dddw_reffpf_f_02", "", 0);
    this.gf_combo_head_sync(this.ds_Head, "ARG_DEPTNO", this.div_Head.cbo_Deptno, "co_dddw_depot_exp_saupj", application.gvs_defsaupj, 0);

    if (input_Mode == 'I') {
        if (NXCore.isEmpty(this.parent.parent.fvs_OpenRetv) || this.parent.parent.fvs_OpenRetv == '') {
            this.ds_Head.setColumn(0, "ARG_SDATE", this.gf_today());
        }
        else {
            this.ds_Head.setColumn(0, "ARG_SDATE", vs_param[3]);
        }
    }
    else {
        if (NXCore.isEmpty(this.parent.parent.fvs_OpenRetv) || this.parent.parent.fvs_OpenRetv == '') {
            this.ds_Head.setColumn(0, "ARG_SDATE", this.gf_addmonths(this.gf_today(), -1));
            this.ds_Head.setColumn(0, "ARG_EDATE", this.gf_today());
        }
        else {
            this.ds_Head.setColumn(0, "ARG_SDATE", vs_param[3]);
            this.ds_Head.setColumn(0, "ARG_EDATE", vs_param[3]);
        }
    }

    //사업장 세팅 
    this.gf_check_saupj(this.div_Head.cbo_Saupj);
    this.ds_Head.setColumn(0, "ARG_SAUPJ", application.gvs_defsaupj);
    this.ds_Head.setColumn(0, "ARG_DEPTNO", 'ZA161');

    if (!NXCore.isEmpty(this.parent.parent.fvs_OpenRetv) && this.parent.parent.fvs_OpenRetv != '') {

        if (input_Mode == 'M') {
            this.ds_Head.setColumn(0, "ARG_CVCOD", vs_param[1]);
            this.ds_Head.setColumn(0, "ARG_CVNAS", vs_param[4]);

            this.div_Input_Mode.Div00.btn_Modify.bringToPrev();
            this.div_Input_Mode.Div00.btn_Input.style.set_opacity(40);
            this.div_Input_Mode.Div00.btn_Modify.style.set_opacity(100);

            this.parent.parent.fvs_OpenRetv = '';

            this.btn_query_onclick();
        }
        else {
            //alert("aaaa");
            //this.ds_Head.setColumn(0, "ARG_SDATE", this.gf_today()); 
            this.ds_Head.setColumn(0, "ARG_CVCOD", vs_param[1]);
            this.ds_Head.setColumn(0, "ARG_CVNAS", vs_param[4]);

            this.parent.parent.fvs_OpenRetv = '';

            this.btn_query_onclick();
        }
    }

}

/***************************************************************************************************************************
 * 버튼 처리            
 * 프로그램별 버튼 세팅 : 시스템 - 시스템관리 - 프로그램 등록 에서 처리 
 * DB : MENU_DETAIL 의 해당 컬럼 참조 																					
 * 이벤트 : this.btn_"컬럼명( 끝의'YN'제외)"_onclick = function(obj:Button,  e:nexacro.ClickEventInfo)					
 * 예졔 : 																													
 * 조회버튼 : this.btn_query_onclick = function(obj:Button,  e:nexacro.ClickEventInfo)										
 * 생성버튼 : this.btn_create_onclick = function(obj:Button,  e:nexacro.ClickEventInfo)									
 ****************************************************************************************************************************/

//조회 
this.btn_query_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    if (!this.ff_required_chk("R")) return;
    this.ff_Tran("SELECT_LIST");
}

// 추가
this.btn_add_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
}

// 삽입
this.btn_insert_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
}

// 삭제
this.btn_delete_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var i;
    if (input_Mode == 'I') return;

    if (!this.ff_required_chk('M')) return;

    if (this.gf_message_chk("1115", "") == 1) {	// Msg : 선택하신 자료를 삭제 하시겠습니까?

        vs_Cino = this.ds_List.getColumn(this.grd_List.currentrow, "CINO");
        vs_Saledate = this.ds_List.getColumn(this.grd_List.currentrow, "SALEDT");
        vs_Expno = this.ds_List.getColumn(this.grd_List.currentrow, "EXPNO");
        vs_Deptno = this.ds_Head.getColumn(0, "ARG_DEPTNO");

        vs_Sql = "UPDATE EXPCIH "
            + " SET CISTS = '1',  "
            + "		OUTCFDT = NULL, "
            + "		SALEDT = NULL "
            + "	WHERE CINO = '" + vs_Cino + "' AND CISTS IN ('2','3')";

        this.gf_UpdateSql_sync(vs_Sql, 'DELETE_EXPCIH', "ff_Callback_sync", 0);



    }

}

// 저장
this.btn_save_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    if (input_Mode != 'I') return;
    if (this.ds_Detail.rowcount <= 0) {
        this.gf_message_chk("102740", "");
        return;
    }

    if (!this.ff_required_chk(pvs_Mode)) return;   // 에러 발생시 리턴
    vs_Sql = "";

    vs_Cino = this.ds_List.getColumn(this.grd_List.currentrow, "CINO");
    vs_Sudate = this.ds_Head.getColumn(0, "ARG_SDATE");
    //마감여부 확인
    vs_Sql = " SELECT FUN_ERP100000050('C0', '" + vs_Sudate + "', '1') AS CNFDATE FROM DUAL";
    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT_CNF", "ff_Callback");

    if (this.ds_Temp.getColumn(0, "CNFDATE") != vs_Sudate) {
        this.gf_message_chk("170", "");  // 마감을 확인하십시요!!
        return;
    }

    if (this.gf_message_chk("1120", "") == 1) {	// Msg : 저장 하시겠습니까?
        vs_Cunit = this.ds_Detail.getColumn(0, "CURR");

        vs_Sql = " SELECT NVL(RSTAN,0) AS RSTAN , NVL(USDRAT,0) AS USDRAT FROM RATEMT WHERE RDATE = '" + vs_Sudate + "' AND RCURR = '" + vs_Cunit + "'";
        this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT_CUNIT", "ff_Callback");

        if (this.ds_Temp.rowcount <= 0) {
            this.gf_message_chk("103248", "");  // 출고일자에 해당하는 환율정보가 존재하지 않습니다.
            return;
        }
        else {
            if (this.ds_Temp.getColumn(0, "RSTAN") == 0) {
                vn_Wrate = 1;
            }
            else {
                vn_Wrate = this.ds_Temp.getColumn(0, "RSTAN");
            }

            if (this.ds_Temp.getColumn(0, "USDRAT") == 0) {

                vn_Urate = 1;
            }
            else {
                vn_Urate = this.ds_Temp.getColumn(0, "USDRAT");
            }
        }

        if (this.ds_List.getColumn(this.grd_List.currentrow, "LOCALYN") == 'Y') {
            vs_Salecnf = this.gf_Getsyscnfg('S', 8, '15');
        }
        else {
            vs_Salecnf = this.gf_Getsyscnfg('S', 8, '10');
        }

        //창고 자동출고여부 확인 
        vs_Deptno = this.ds_Head.getColumn(0, "ARG_DEPTNO");

        vs_Sql = " SELECT OUCNF FROM VNDMST_STOCK WHERE CVCOD = '" + vs_Deptno + "' ";
        this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT_DEPTCNF", "ff_Callback");

        if (this.ds_Temp.getColumn(0, "OUCNF") == 'Y') {
            vs_Cists = '2';
            vs_Outdate = vs_Sudate;
        }
        else {
            vs_Cists = '3';
            vs_Outdate = '';
        }

        vs_Sql = "";
        if (vs_Salecnf == '2') {
            vs_Sql = "UPDATE EXPCIH "
                + " SET CISTS = '" + vs_Cists + "', "
                + "		WRATE = " + vn_Wrate + ", "
                + "		URATE = " + vn_Urate + ", "
                + "		OUTCFDT = '" + vs_Outdate + "', "
                + "		SALEDT = '" + vs_Sudate + "' "
                + "	WHERE CINO = '" + vs_Cino + "' ";
        }
        else {
            vs_Sql = "UPDATE EXPCIH "
                + " SET CISTS = '" + vs_Cists + "', "
                + "		WRATE = " + vn_Wrate + ", "
                + "		URATE = " + vn_Urate + ", "
                + "		OUTCFDT = '" + vs_Outdate + "' "
                + "	WHERE CINO = '" + vs_Cino + "' ";

        }

        this.gf_UpdateSql_sync(vs_Sql, 'UPATE_EXPCIH', "ff_Callback_sync", 0);
    }
    else {
        return;
    }

}

//취소 
this.btn_cancel_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    this.ff_SetCondition();
}

// 닫기
this.btn_close_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    //this.gf_argment_save(this.div_Head);
    this.gf_closeMenu();
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
    // obj를 dataset를 확인 해서 처리 함.	
    if (obj == '[object Dataset]') {
        vn_Row = e.row;
        vs_Data = e.newvalue;
        // dataset 이름 별로 처리 
        if (obj.id == 'ds_Head') {
            return;
        }
        else if (obj.id == 'ds_Detail') {
            switch (e.columnid) {
                case 'CINBR':
                    break;
            }
        }
    }
    else {
        //Object 별 처리 
        // 상위 Div 이름을 가져와서 각각처리 함.
        vs_Data = e.postvalue;
        if (obj.parent.name == 'div_Head') {
            this.ds_Detail.clearData();
            this.ds_List.clearData();
            this.ds_Detail.clearData();
            switch (obj.name) {
                case 'edt_Cvcod':
                    if (NXCore.isEmpty(vs_Data)) {
                        this.div_Head.edt_Cvnas.set_value(null);
                        return;
                    }

                    vs_Sql = " SELECT CVNAS FROM VNDMST WHERE  CVCOD = '" + vs_Data + "' ";
                    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT_CVCOD", "ff_Callback");

                    if (vi_ErrorCode < 0) return;

                    if (this.ds_Temp.rowcount == 0) {
                        this.div_Head.edt_Cvcod.set_value(null);
                        this.div_Head.edt_Cvnas.set_value(null);
                    }
                    else {
                        this.div_Head.edt_Cvnas.set_value(this.ds_Temp.getColumn(0, "CVNAS"));
                    }
                    break;
                case 'cbo_Saupj':
                    this.ff_Deptno(vs_Data);

                    // fvs_9x(1:절사,2:반올림)
                    // fvn_9y(위치지정(-1:십단위,0:원단위,1:소수점1자리,2:소수점2자리))
                    // fvn_9z(부가세(증치세))
                    var vs_Sql = " SELECT FUN_GET_SAL_PUR1('9X','" + vs_Data + "') AS RFNA1, FUN_GET_SAL_PUR2('9Y','" + vs_Data + "') AS RFNA2, FUN_GET_SAL_PUR3('9Z','" + vs_Data + "') AS RFNA3 FROM DUAL ";
                    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "RFNA_SELECT", "ff_Callback_sync1");
                    if (this.ds_Temp.rowcount == 0 || NXCore.isEmpty(this.ds_Temp.getColumn(0, "RFNA1"))) {
                        fvs_9x = '2';
                        fvn_9y = -1;
                        fvn_9z = 0.1;
                    }
                    else {
                        if (NXCore.isEmpty(this.ds_Temp.getColumn(0, "RFNA1"))) {
                            fvs_9x = '2';
                        }
                        else {
                            fvs_9x = this.ds_Temp.getColumn(0, "RFNA1");
                        }
                        if (NXCore.isEmpty(this.ds_Temp.getColumn(0, "RFNA2"))) {
                            fvn_9y = -1;
                        }
                        else {
                            fvn_9y = this.ds_Temp.getColumn(0, "RFNA2");
                        }
                        if (NXCore.isEmpty(this.ds_Temp.getColumn(0, "RFNA3"))) {
                            fvn_9z = 0.1;
                        }
                        else {
                            fvn_9z = this.ds_Temp.getColumn(0, "RFNA3");
                        }
                    }

                    break;

            }
            //자동으로 조회 되도록 처리 
            this.btn_query_onclick();
        }
        else if (obj.parent.name == 'Div_Detail') {
            return;
        }

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
        if (obj.id == 'grd_List') {
            this.ds_Head.setColumn(0, "ARG_CINO", this.ds_List.getColumn(e.row, "CINO"));
            this.ff_Tran("SELECT_DETAIL");
            return;
        }
    }
    else {
        if (obj.parent.name == 'div_Head') {
            return;
        }
        else if (obj.parent.name == 'Div_Detail') {
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
    // obj.id의 앞 4자리가 "grd_"로 시작 하면 Grid로 인식 함.	
    if (obj == '[object Grid]') {
        if (obj.id == 'grd_detail') {
            switch (this.gf_GetCellBind(obj, e.cell, 'Body')) {
                case 'CINBR':
                    break;
            }
            return;
        }
    }
    else {
        if (obj.parent.name == 'div_Head') {
            switch (obj.name) {
                case 'edt_Cvcod':
                    //구분에 따른 거래처 선택
                    vs_Arg = '2' + "|" + '' + "|" + '' + "|" + 'S' + "|" + this.ds_Head.getColumn(0, 'ARG_SAUPJ');
                    var resultForm = this.gf_showPopup("popup_cvcod", "co_popu::co_popu_vndmst_f.xfdl", { width: 10, height: 20 },
                        {
                            OpenRetv: 'Y',   // popup open 즉시 조회  
                            MultSelect: 'N',   // MULTI LINE 선택
                            Argument: vs_Arg  // 조회조건 파라메터 
                        }, { callback: "ff_AfterPopup" });
                    break;
            }
        }
        else if (obj.parent.name == 'Div_Detail') {
            return;
        }
    }
}

/***********************************************************************
 * User created function specification
 ************************************************************************/
// 조건 체크 (필수 입력 항목 체크)
this.ff_required_chk = function (vs_Mode) {
    var vs_Gbn;
    var vs_Data, vs_Itcls;
    var i, vn_Row;

    // 공통 체크처리 


    // 등록(I), 수정(M), 조회(R) 에서 필수 값 체크 
    // 가능하면 HEAD, MASTER까지 모두 여기서 체크, 처리 해주세요.	
    switch (vs_Mode) {
        //조회
        case "R":
            if (NXCore.isEmpty(this.ds_Head.getColumn(this.ds_Head.rowposition, "ARG_SDATE"))) {
                this.gf_message_chk("200", this.gf_get_trans_word("출고일자"));
                this.div_Head.cal_Sdate.setFocus();  // cursor set
                return false;
            }
            if (NXCore.isEmpty(this.ds_Head.getColumn(this.ds_Head.rowposition, "ARG_DEPTNO"))) {
                this.gf_message_chk("200", this.gf_get_trans_word("출고창고"));
                this.div_Head.cbo.setFocus();  // cursor set
                return false;
            }
            if (input_Mode != 'I') {
                if (NXCore.isEmpty(this.ds_Head.getColumn(this.ds_Head.rowposition, "ARG_EDATE"))) {
                    this.gf_message_chk("200", this.gf_get_trans_word("출고일자"));
                    this.div_Head.cal_Edate.setFocus();  // cursor set
                    return false;
                }
            }
            break;
        //입력 
        case "I":
            if (pvs_SysChk == 'N') {
                for (i = 0; i < this.ds_Detail.rowcount; i++) {
                    if (this.ds_Detail.getColumn(i, "CIQTY") > this.ds_Detail.getColumn(i, "HOLD_QTY")) {
                        this.gf_message_chk("101687", "");
                        this.gf_cursor_setting(this.grd_Detail, i, "CIQTY");
                    }
                }
            }
            break;
        //수정모드  
        case "M":
            vs_Cino = this.ds_List.getColumn(this.grd_List.currentrow, "CINO");
            vs_Saledate = this.ds_List.getColumn(this.grd_List.currentrow, "SALEDT");
            vs_Expno = this.ds_List.getColumn(this.grd_List.currentrow, "EXPNO");
            vs_Deptno = this.ds_Head.getColumn(0, "ARG_DEPTNO");

            //매출 확정에 따른 삭제여부 확인 
            vs_Sql = " SELECT NVL(LOCALYN, '') AS LOCALYB FROM EXPCIH WHERE CINO = '" + vs_Cino + "'";

            this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT_LOCALYN", "ff_Callback");

            if (this.ds_Temp.getColumn(0, "LOCALYB") == 'Y') {
                vs_Salecnf = this.gf_Getsyscnfg('S', 8, '15');
            }
            else {
                vs_Salecnf = this.gf_Getsyscnfg('S', 8, '10');
            }

            if (vs_Salecnf != '2') {
                if (!NXCore.isEmpty(vs_Saledate)) {
                    alert("매출이 확정되어 삭제할 수 없습니다.");
                    return false;
                }
            }
            if (!NXCore.isEmpty(vs_Expno)) {
                this.gf_message_chk("102235", ""); //이미 면장이 발행되어 삭제할 수 없습니다.
                return false;
            }

            // 창고의 자동출고승인여부를 확인해서 수동일경우 출고승인 확인 
            vs_Sql = " SELECT OUCNF FROM VNDMST_STOCK WHERE CVCOD = '" + vs_Deptno + "' ";
            this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT_DEPTCNF", "ff_Callback");

            if (this.ds_Temp.getColumn(0, "OUCNF") == 'N') {
                vs_Sql = " SELECT COUNT(*) AS CNT FROM IMHIST_SAL WHERE INV_NO = '" + vs_Cino + "' AND IO_DATE IS NOT NULL ";
                this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT", "ff_Callback");

                if (this.ds_Temp.getColumn(0, "CNT") > 0) {
                    this.gf_message_chk("102265", ""); //이미 출고승인되어 삭제할 수 없습니다.
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
        case "SELECT_LIST":
            if (NXCore.isEmpty(this.ds_Head.getColumn(this.ds_Head.rowposition, "ARG_CVCOD"))) {
                this.ds_Head.setColumn(0, "ARG_CVCOD_P", "%");
            }
            else {
                this.ds_Head.setColumn(0, "ARG_CVCOD_P", this.ds_Head.getColumn(0, "ARG_CVCOD"));
            }
            this.ds_Head.setColumn(0, "ARG_CINO", "");
            // 수정모드에서 창고에 따른 자동출고구분 확인 해서 ARG_STS로 처리 
            if (input_Mode != 'I') {
                var vs_Sql = " SELECT OUCNF FROM VNDMST_STOCK  WHERE CVCOD = '" + this.ds_Head.getColumn(0, "ARG_DEPTNO") + "'  ";
                this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT_STS", "ff_Callback");

                if (vi_ErrorCode < 0) return;

                if (this.ds_Temp.getColumn(0, "OUCNF") == 'Y') {
                    this.ds_Head.setColumn(0, "ARG_STS", '2');
                }
                else {
                    this.ds_Head.setColumn(0, "ARG_STS", '3');
                }
            }

            v_SvcAct = pvs_SvcAct;
            v_OutDataset = pvs_OutDataset;
            v_InDataset = pvs_InDataset;
            v_Argument = "";

            break;
        case "SELECT_DETAIL":
            if (input_Mode == 'I') {
                pvs_Detail_SvcAct = "em/ship/em_ship_expout_e_4q.jsp"
                pvs_Detail_OutDataset = "ds_Detail = output1";
                pvs_Detail_InDataset = "ds_para=ds_Head";
                v_Argument = "";
            }
            else {
                pvs_Detail_SvcAct = "em/ship/em_ship_expout_e_5q.jsp"
                pvs_Detail_OutDataset = "ds_Detail = output1";
                pvs_Detail_InDataset = "ds_para=ds_Head";
                v_Argument = "";
            }

            //폼 변경으로 인해 변수에서 입력하고 처리 
            v_SvcAct = pvs_Detail_SvcAct;
            v_OutDataset = pvs_Detail_OutDataset;
            v_InDataset = pvs_Detail_InDataset;
            v_Argument = "";
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
        case "SELECT_LIST":
            var vs_Cino;
            if (this.ds_List.rowcount > 0) {
                vs_Cino = this.ds_List.getColumn(0, "CINO");
                this.ds_Head.setColumn(0, "ARG_CINO", vs_Cino);
                this.ff_Tran("SELECT_DETAIL");
            }
            else {
                this.gf_message_chk("110", ""); // 조회 및 출력할 자료가 없습니다.				
            }
            break;
        case "SELECT_DETAIL":
            this.ds_Detail.set_keystring("S:+CISEQ");
            break;
    }
}


this.ff_Callback_sync = function (sSvcID, ErrorCode, ErrorMsg) {
    var i;
    vi_ErrorCode = ErrorCode;     // 콜백루틴의 에러코드        싱크트란잭션일경우 사용
    vs_ErrorMsg = ErrorMsg;      //// 콜백루틴의 에러메세지    싱크트란잭션일경우 사용
    if (ErrorCode < 0) {
        NXCore.alert('CallBack SVCID = ' + sSvcID + '  ErrorCode = ' + ErrorCode + ' MSG = ' + ErrorMsg);
    }
    switch (sSvcID) {
        case "UPATE_EXPCIH":
            if (vi_ErrorCode == 0) {
                var vs_DeptId, vs_EmpId;
                vs_DeptId = application.gvs_deptid;
                vs_EmpId = application.gvs_empid;
                var vResult = this.gf_Procedure_sync("ERP100000090", vs_Cino + "|" + vs_Sudate + "|" + vs_Cists + "|" + vs_DeptId + "|" + vs_EmpId, "PROCEDURE_ERP100000090", "ff_Callback_sync", 0);
                if (vResult < 0) {
                    this.gf_message_chk("102542", "");
                    vs_Sql = "UPDATE EXPCIH "
                        + " SET CISTS = '1',  "
                        + "		OUTCFDT = NULL, "
                        + "		SALEDT = NULL "
                        + "	WHERE CINO = '" + vs_Cino + "' AND CISTS IN ('2','3')";

                    this.gf_UpdateSql_sync(vs_Sql, 'ROLLBACK_EXPCIH', "ff_Callback_sync", 0);
                    return;
                }
            }
            break;
        case "PROCEDURE_ERP100000090":
            if (vi_ErrorCode == 0) {
                this.gf_message_chk("102581", "");
                this.ff_input_mode('I');
            }
            break;
        case "DELETE_EXPCIH":
            if (pvs_SysChk != 'Y') {
                for (i = 0; i <= this.ds_Detail.rowcount - 1; i++) {
                    var vs_Holdno = this.ds_Detail.getColumn(i, "HOLD_NO");
                    vs_Sql = " UPDATE HOLDSTOCK  "
                        + "        SET OUT_CHK = '1', HOSTS = 'N'  "
                        + "	WHERE HOLD_NO = '" + vs_Holdno + "'	";

                    this.gf_UpdateSql_sync(vs_Sql, 'UPDATE_HOLDSTOCK', "ff_Callback_sync", 0);
                }
                //vs_Sql = vs_Sql.substr(4);				

            }
            vs_Sql = "DELETE FROM IMHIST_SAL WHERE INV_NO = '" + vs_Cino + "'";
            this.gf_UpdateSql_sync(vs_Sql, 'DELTE_IMHISTSAL', "ff_Callback_sync", 0);
            break;
        case "UPDATE_HOLDSTOCK":
            break;
        case "DELTE_IMHISTSAL":
            if (vi_ErrorCode == 0) {
                this.gf_message_chk("101434", "");
                this.ff_input_mode('M');
            }
            break;
    }


}

// pupup의 콜백함수 처리
this.ff_AfterPopup = function (strId, obj) {
    var va_Data = this.gf_popup_data(obj);  // popup 에서 넘어온 data 를 array 로 받아온다.

    if (va_Data == false) return;  // 자료 없음 

    switch (strId) {
        // div_Head_onrbuttonup 에서 this.gf_showPopup("popup_edt_larg","","")  <-- 로 분류 하여 후처리 
        case "popup_cvcod":
            for (var i = 0; i < va_Data.length; i++) {
                this.div_Head.edt_Cvcod.set_value(va_Data[i][0]);
                this.div_Head.edt_Cvnas.set_value(va_Data[i][2]);
            }
            var vs_ObjComp = this.getNextComponent(this.div_Head.edt_Cvcod);
            vs_ObjComp.setFocus();
            break;
    }

    return;
}


this.ff_Deptno = function (vData) {
    var vs_Saupj;
    if (NXCore.isEmpty(vData)) {
        vs_Saupj = '%';
    }
    else {
        vs_Saupj = vData;
    }
    var vs_Sql = " SELECT min(CVCOD)      "
        + " FROM VNDMST_STOCK      "
        + " WHERE JUMAECHUL IN ('2', '7')  "               //// 창고구분(1:생산, 2:일반, 3:불량, 4:납품처 가상(위탁창고), 5:MRO창고, 6:공정불량, 7:영업소)
        + "   AND JUHANDLE  = '2'  "       //// 내수수출구분(1:내수, 2:수출)
        + "   AND ITTYP IN ('1', '3', '7')     "   ///// 품목구분 (1:완제품, 3:원자재, 7:상품)
        + "   AND SAUPJ     = '" + vs_Saupj + "' ";

    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT_DEPTNO", "ff_Callback");

    if (this.ds_Temp.rowcount == 0) {
        this.ds_Head.setColumn(0, "ARG_DEPTNO", "");
    }
    else {
        this.ds_Head.setColumn(0, "ARG_DEPTNO", this.ds_Temp.getColumn(0, "DEPTNO"));
    }
}
