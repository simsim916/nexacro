/***********************************************************************
 * 01. Creation date      : 2015.07.28
 * 02. Created by         : 배진관
 * 03. Revision history   : 
 ************************************************************************/

/*************************************************************************************************************
* 프로그램 필수 
*************************************************************************************************************/
include "lib::common_form.xjs";
include "sm_co::sm_co_util_neo.xjs";

//item changed를 통해 쿼리가 변경 될 경우 사용, 아닐경우 ff_Tran()에서 직접 입력
var pvs_SvcAct, pvs_Save_SvcAct;
var pvs_OutDataset, pvs_InDataset, pvs_Save_OutDataset, pvs_Save_InDataset;

var input_Mode = 'I';	// 등록 수정 모드 "등록"

this.vi_ErrorCode = undefined;	// 콜백루틴의 에러코드	싱크트란잭션일경우 사용
this.vs_ErrorMsg = undefined;	// 콜백루틴의 에러메세지	싱크트란잭션일경우 사용

this.fvs_saupcode_visible = "Y";	// 사업장 VISIBLE 여부
this.fvs_saupcode_all = "N";		// 사업장 전체 여부
this.fvs_companycode = "";
this.fvs_saupcode = "";

var fvs_enter = 'N';
var fvs_iogbn = "";
var fvs_nap;
var fvs_janday;
var fvs_chulday;
var fvs_today;

var fvs_ivs_curr;	// 법인통화
var fvs_9x;			// 1:절사,2:반올림
var fvn_9y;			// 위치지정(-1:십단위,0:원단위,1:소수점1자리,2:소수점2자리)
var fvn_9z;			// 부가세(증치세)

//--------------------------------------------------------------------
// on load event  페이지가 열릴때
//--------------------------------------------------------------------
this.form_onload = function (obj: Form, e: nexacro.LoadEventInfo) {
    this.gf_formOnload(obj);
    this.ff_load(obj);
}

//--------------------------------------------------------------------
// 초기 작업 수행
//--------------------------------------------------------------------
this.ff_load = function (obj) {
    this.ff_SetCondition();   // 초기 조건 파라메터 셋팅 및 콤보 셋팅
}

//--------------------------------------------------------------------
// 초기 조건 파라메터 셋팅밍 콤보 셋팅
//--------------------------------------------------------------------
this.ff_SetCondition = function () {
    // 초기 값 세팅
    this.div_head.set_enable(true);

    this.ds_head.clearData();
    this.ds_master.clearData();
    this.ds_detail.clearData();
    this.ds_master_1.clearData();

    fvs_today = this.gf_today();

    var vn_row = this.ds_head.addRow();

    this.ds_head.setColumn(vn_row, "ARG_SDATE", fvs_today);
    this.ds_head.setColumn(vn_row, "ARG_NAP_EMP", application.gvs_empid);
    this.ds_head.setColumn(vn_row, "ARG_NAP_EMPNAME", application.gvs_username);

    if (input_Mode == 'I') {
        this.grd_master.setFormat("MASTER_INPUT");
        this.gf_mdi_btn_enable("add");
        this.div_head.edt_iojpno.set_readonly(true);
        this.div_head.edt_cvcod.set_readonly(false);
        this.div_head.edt_cvnas.set_readonly(false);
        this.div_head.edt_nap_empno.set_enable(true);
        this.div_head.edt_bardata.set_enable(true);
        this.div_head.cbo_depot.set_readonly(false);
        this.div_head.cbo_depotbad.set_readonly(false);
        this.div_head.cal_sdate.set_readonly(false);
        this.div_head.edt_nap_empno.set_readonly(false);
        this.div_head.edt_iojpno.set_cssclass("readonly");
        this.div_head.edt_cvcod.set_cssclass("input_point");
        this.div_head.edt_cvnas.set_cssclass("");
        this.div_head.edt_nap_empno.set_cssclass("");
        this.div_head.cbo_depot.set_cssclass("input_point");
        this.div_head.cbo_depotbad.set_cssclass("input_point");
        this.div_head.cal_sdate.set_cssclass("input_point");
        this.div_head.edt_nap_empno.set_cssclass("input_point");
        this.grd_master.set_binddataset("ds_master");
        this.div_head.EXCEL_UP.set_visible("true");
        this.div_head.edt_cvcod.setFocus();
    }
    else {
        this.grd_master.setFormat("MASTER_MODE");
        this.gf_mdi_btn_disable("add");
        this.div_head.edt_iojpno.set_readonly(false);
        this.div_head.edt_cvcod.set_readonly(true);
        this.div_head.edt_cvnas.set_readonly(true);
        this.div_head.edt_nap_empno.set_enable(false);
        this.div_head.edt_bardata.set_enable(false);
        this.div_head.cbo_depot.set_readonly(true);
        this.div_head.cbo_depotbad.set_readonly(true);
        this.div_head.cal_sdate.set_readonly(true);
        this.div_head.edt_iojpno.set_cssclass("input_point");
        this.div_head.edt_cvcod.set_cssclass("readonly");
        this.div_head.edt_cvnas.set_cssclass("readonly");
        this.div_head.edt_nap_empno.set_cssclass("readonly");
        this.div_head.cbo_depot.set_cssclass("readonly");
        this.div_head.cbo_depotbad.set_cssclass("readonly");
        this.div_head.cal_sdate.set_cssclass("readonly");
        this.grd_master.set_binddataset("ds_master_1");
        this.div_head.EXCEL_UP.set_visible("false");
        this.div_head.edt_iojpno.setFocus();

    }

    // 콤보 데이타셋 조회 
    //this.gf_combo_grd_sync(this.grd_master, "GUCOD", "co_dddw_reffpf_f_5m", "", 0);
    this.gf_combo_grd_sync(this.grd_master, "GUCOD", "01^" + this.gf_get_trans_word("정상반품") + "@02^" + this.gf_get_trans_word("불량반품"), "", 0);
    this.gf_combo_grd_sync(this.grd_master, "JNPCRT", "005^" + this.gf_get_trans_word("정상반품") + "@057^" + this.gf_get_trans_word("불량반품"), "", 0);
    this.gf_combo_grd_sync(this.grd_master, "YEBI2", "co_dddw_reffpf_f_10", "", 0);
    this.gf_combo_grd_sync(this.grd_master, "SUGUGB", "co_dddw_reffpf_f_5a", "", 0);	//주문구분

    this.ff_jfDepotno(application.gvs_defsaupj);

    fvs_nap = this.gf_Getsyscnfg('S', 21, '2');		// 납품담당자필수여부
    fvs_janday = this.gf_Getsyscnfg('S', 19, '21');	// 반품불허 잔여유효기간(일,미만)
    fvs_chulday = this.gf_Getsyscnfg('S', 19, '22');	// 반품허용 반품기간(일,출고후 반품까지)

    if (NXCore.isEmpty(fvs_nap)) fvs_nap = 'N';

    if (fvs_nap == 'Y')
        this.div_head.edt_nap_empno.set_cssclass("input_point");
    else
        this.div_head.edt_nap_empno.set_cssclass("");
}

//--------------------------------------------------------------------
// 2. 버튼 이벤트
//--------------------------------------------------------------------

/*************************************************************************************************************
* 입력프로그램 필수??
*************************************************************************************************************/

//--------------------------------------------------------------------
// 화면을 닫기전에 수정사항이 있으면 저장할것인지 묻는다.
//--------------------------------------------------------------------
this.form_onbeforeclose = function (obj: Form, e: CloseEventInfo) {
    var vb_true = true;

    if (NXCore.isModified(this.ds_master)) {
        if (this.gf_message_chk("1180", "") == 1)	// 변경된 자료가 있습니다. 취소하시겠습니까?	
            vb_true = true;
        else
            vb_true = false;
    }

    return vb_true;
}

/*************************************************************************************************************
* 입력 프로그램 필수 끝
*************************************************************************************************************/

/****************************************************************************************************************************
 * 버튼 처리
 * 프로그램별 버튼 세팅 : 시스템 - 시스템관리 - 프로그램 등록 에서 처리
 * DB : MENU_DETAIL 의 해당 컬럼 참조
 * 이벤트 : this.btn_"컬럼명( 끝의'YN'제외)"_onclick = function(obj:Button,  e:nexacro.ClickEventInfo)
 * 예졔 :
 * 조회버튼 : this.btn_query_onclick = function(obj:Button,  e:nexacro.ClickEventInfo)
 * 생성버튼 : this.btn_create_onclick = function(obj:Button,  e:nexacro.ClickEventInfo)
 ****************************************************************************************************************************/

//--------------------------------------------------------------------
// 조회
//--------------------------------------------------------------------
this.btn_query_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    if (!this.ff_required_chk("SELECT_MASTER")) return;

    var vs_iojpno = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_IOJPNO");
    var vs_sql = " SELECT DISTINCT "
        + "        A.SUDAT, A.SAUPJ, A.CVCOD, B.CVNAS, A.DEPOT_NO, A.FACGBN, A.NAP_EMP "
        + "   FROM IMHIST_SAL A, "
        + "        VNDMST B "
        + "  WHERE A.CVCOD = B.CVCOD(+) "
        + "    AND A.IOJPNO LIKE '" + vs_iojpno + "%' ";

    this.gf_SelectSql_sync("ds_temp : " + vs_sql, "IMHIST_SELECT", "ff_Callback");
    if (this.vi_ErrorCode < 0) {
        this.gf_message_chk("102800", ""); //전표를 찾을 수가 없습니다.
    }
    else {
        this.ds_head.setColumn(this.ds_head.rowposition, "ARG_SDATE", this.ds_temp.getColumn(0, "SUDAT"));
        this.ds_head.setColumn(this.ds_head.rowposition, "ARG_SAUPJ", this.ds_temp.getColumn(0, "SAUPJ"));
        this.ds_head.setColumn(this.ds_head.rowposition, "ARG_CVCOD", this.ds_temp.getColumn(0, "CVCOD"));
        this.ds_head.setColumn(this.ds_head.rowposition, "ARG_CVNAS", this.ds_temp.getColumn(0, "CVNAS"));
        this.ds_head.setColumn(this.ds_head.rowposition, "ARG_DEPOT", 'Z10001');
        //this.ds_head.setColumn(this.ds_head.rowposition, "ARG_DEPOT",   this.ds_temp.getColumn(0, "DEPOT_NO"));
        this.ds_head.setColumn(this.ds_head.rowposition, "ARG_FACGBN", this.ds_temp.getColumn(0, "FACGBN"));
        this.ds_head.setColumn(this.ds_head.rowposition, "ARG_NAP_EMP", this.ds_temp.getColumn(0, "NAP_EMP"));
        this.ff_Tran("SELECT_MASTER");
    }
}

//--------------------------------------------------------------------
// 추가
//--------------------------------------------------------------------
this.btn_add_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    if (input_Mode == 'I') {
        if (!this.ff_required_chk("ADD_MASTER")) return;
        var vi_row = this.ds_detail.insertRow(0);
        this.gfn_set_zero_dataset(this.ds_detail, vi_row, "");
        this.ds_detail.setColumn(vi_row, "LOTTYPE", "N");
        this.ds_detail.setColumn(vi_row, "LOT_ST_SEQ", '');
        this.ds_detail.setColumn(vi_row, "LOT_ED_SEQ", '');

        //this.div_head.set_enable(false);
        // 		var vi_row = this.ds_master.addRow();
        // 		this.gf_cursor_setting(this.grd_master, vi_row, "ESTNO");
        // 
        // 		this.ds_master.setColumn(vi_row, "SUDAT",   this.ds_head.getColumn(this.ds_head.rowposition, "ARG_SDATE"));
        // 		this.ds_master.setColumn(vi_row, "CUST_NO", this.ds_head.getColumn(this.ds_head.rowposition, "ARG_CVCOD"));
        // 		this.ds_master.setColumn(vi_row, "CUSTNM",  this.ds_head.getColumn(this.ds_head.rowposition, "ARG_CVNAS"));
    }
}

//--------------------------------------------------------------------
// 삽입
//--------------------------------------------------------------------
this.btn_insert_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    this.btn_add_onclick();
}

//--------------------------------------------------------------------
// 삭제
//--------------------------------------------------------------------
this.btn_delete_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vs_update_sql = '';

    if (input_Mode == 'I') {
        var vn_row = this.ds_master.rowposition;
        var vs_itnbr = this.ds_master.getColumn(vn_row, "ITNBR");

        for (var i = this.ds_detail.rowcount - 1; i >= 0; i--) {
            var vs_itnbr2 = this.ds_detail.getColumn(i, "ITNBR");
            if (vs_itnbr == vs_itnbr2)
                this.ds_detail.deleteRow(i);
        }
        this.ds_master.deleteRow(vn_row);
    }
    else if (input_Mode == 'M') {
        if (!this.ff_required_chk("DELETE_MASTER")) return;

        //선택하신 자료를 삭제 하시겠습니까?
        if (this.gf_message_chk("1115", "") == 0) return;

        var vn_del = 0;

        for (var i = this.ds_master_1.rowcount - 1; i >= 0; i--) {
            if (this.ds_master_1.getColumn(i, "DEL") == '1') {
                var vs_iojpno = this.ds_master_1.getColumn(i, "IOJPNO");

                if (this.ds_master_1.getColumn(i, "JNPCRT") == '057') {
                    // 상대전표
                    if (vs_update_sql == "") {
                        vs_update_sql = " DELETE FROM IMHIST_SAL WHERE IP_JPNO = '" + vs_iojpno + "' ";
                    }
                    else {
                        vs_update_sql += "@#$ ";
                        vs_update_sql += " DELETE FROM IMHIST_SAL WHERE IP_JPNO = '" + vs_iojpno + "' ";
                    }
                }

                if (vs_update_sql == "")
                    vs_update_sql = " DELETE FROM IMHIST_SAL WHERE IOJPNO = '" + vs_iojpno + "' ";
                else {
                    vs_update_sql += "@#$ ";
                    vs_update_sql += " DELETE FROM IMHIST_SAL WHERE IOJPNO = '" + vs_iojpno + "' ";
                }

                vs_update_sql += "@#$ ";
                vs_update_sql += " DELETE FROM IMHIST_SAL_LOT WHERE IOJPNO = '" + vs_iojpno + "' ";

                this.ds_master_1.deleteRow(i);
                vn_del++;
            }
        }

        if (vn_del <= 0) {
            this.gf_message_chk("210", "");	//자료를 선택하십시요.	자료를 선택하지 않았습니다!!
            return;
        }

        //입고 전표 삭제 후 ff_Callback에서 Dataset 업데이트 처리 
        if (!NXCore.isEmpty(vs_update_sql)) {
            this.gf_UpdateSql_sync(vs_update_sql, 'DELETE_SQL', "ff_Callback", 0);
        }
    }
}

//--------------------------------------------------------------------
// 저장
//--------------------------------------------------------------------
this.btn_save_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    if (!NXCore.isModified(this.ds_master)) {
        this.gf_message_chk("291", "");	// 변경된 자료가 없습니다.
        return;
    }

    if (!this.ff_required_chk("SAVE_MASTER")) return;

    if (this.gf_message_chk("1120", "") == 1) {	// Msg : 저장 하시겠습니까?
        if (this.ff_jfSavertn() == -1) return;
    }
}

//--------------------------------------------------------------------
// 취소
//--------------------------------------------------------------------
this.btn_cancel_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    this.ds_master.clearData();
    this.ds_detail.clearData();
    this.ds_imhist.clearData();
}

//--------------------------------------------------------------------
// 닫기
//--------------------------------------------------------------------
this.btn_close_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    this.gf_closeMenu();
}

//--------------------------------------------------------------------
// 엑셀 업로드 버튼클릭
//--------------------------------------------------------------------
this.EXCEL_UP_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {

    if (!this.ff_required_chk("ADD_MASTER")) return;

    var vs_openRetv = 'Y';
    var vs_args = '';

    var vs_args = this.gf_get_trans_word(" ◎ 주의사항") + "\n"
        + this.gf_get_trans_word("	첫 열에 데이터는 입력 되지 않습니다 ") + "\n"
        + this.gf_get_trans_word("	첫 열에는 바코드, 수량, 단가 순으로 입력해주세요. ") + "\n"
        + this.gf_get_trans_word("	입력된 엑셀 데이터는 수정이 되지 않습니다. ");

    var resultForm = this.gf_showPopup("popup_excel_upload", "co_popu::co_popu_excelupload_ex.xfdl", { width: 10, height: 20 },
        {
            OpenRetv: vs_openRetv,	// popup 즉시 파일찾기
            Argument: vs_args  		// 조회조건 파라메터 
        }, { callback: "ff_AfterPopup" });
}

/****************************************************************************************************************************
 * 버튼 처리 끝
 ****************************************************************************************************************************/

/***************************************************************************************************************************
*Form event 처리
****************************************************************************************************************************/

/***********************************************************************
 * User created function specification
 ************************************************************************/

//--------------------------------------------------------------------
// 사업장별 기본 출고창고 지정
//--------------------------------------------------------------------
this.ff_jfDepotno = function (vSaupj) {
    if (vSaupj < 'C20')
        var vs_ret = "SELECT MIN(CVCOD) AS CVCOD FROM VNDMST_STOCK "
            + " WHERE JUMAECHUL = '2' AND JUHANDLE = '1' AND SAUPJ = '" + vSaupj + "'";
    else
        var vs_ret = "SELECT MAX(CVCOD) AS CVCOD FROM VNDMST_STOCK "
            + " WHERE JUMAECHUL = '2' AND JUHANDLE = '1' AND SOGUAN = '1' AND SAUPJ = '" + vSaupj + "'";

    this.gf_SelectSql_sync("ds_temp : " + vs_ret, "CVCOD_SELECT", "ff_Callback");
    if (this.vi_ErrorCode < 0) return;

    if (this.ds_temp.rowcount > 0)
        this.ds_head.setColumn(this.ds_head.rowposition, "ARG_DEPOT", this.ds_temp.getColumn(0, "CVCOD"));
    //북경창고만사용
    this.ds_head.setColumn(this.ds_head.rowposition, "ARG_DEPOT", 'Z10001');

    // 불량창고 지정
    var vs_sql = " SELECT MIN(CVCOD) AS CVCOD FROM VNDMST_STOCK "
        + " WHERE JUMAECHUL = '3' "
        + "   AND SAUPJ LIKE '" + vSaupj + "' ";

    this.gf_SelectSql_sync("ds_temp : " + vs_sql, "BAD_SELECT", "ff_Callback");

    if (this.vi_ErrorCode < 0)
        this.ds_head.setColumn(this.ds_head.rowposition, "ARG_DEPOTBAD", this.ds_temp.getColumn(0, "CVCOD"));
    else
        this.ds_head.setColumn(this.ds_head.rowposition, "ARG_DEPOTBAD", this.ds_temp.getColumn(0, "CVCOD"));


    //폐기창고만 사용	
    this.ds_head.setColumn(this.ds_head.rowposition, "ARG_DEPOTBAD", 'Z10110');
}

//--------------------------------------------------------------------
// 저장 루틴
//--------------------------------------------------------------------
this.ff_jfSavertn = function () {
    this.ds_imhist.clearData();

    var vs_depot = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_DEPOT");
    var vs_cvcod = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_CVCOD");
    var vs_sdate = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_SDATE");
    var vs_nap_emp = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_NAP_EMP");

    //창고별 자동처리 여부 검색
    var vs_sql = " SELECT NVL(GUMGU,'N') AS IOCNF "
        + "  FROM VNDMST_SUB "
        + " WHERE CVCOD = '" + vs_depot + "' ";
    this.gf_SelectSql_sync("ds_temp : " + vs_sql, "VNDMST_SUB_SELECT", "ff_Callback");
    if (this.vi_ErrorCode < 0) return;

    var vs_iocnf = this.ds_temp.getColumn(0, "IOCNF");
    if (NXCore.isEmpty(vs_iocnf)) vs_iocnf = 'N';

    // 반품 전표 채번
    var vs_jpno = this.fvs_companycode + vs_sdate.substr(2, 6) + this.gf_get_junpyo(vs_sdate, "C0", 4, this.fvs_companycode);
    // 불량반품일 경우 창고 이동을 위해 전표 채번
    var vs_buljpno = this.fvs_companycode + vs_sdate.substr(2, 6) + this.gf_get_junpyo(vs_sdate, "C0", 4, this.fvs_companycode);
    if (vs_jpno.length < 12) {
        this.gf_message_chk("102818", ""); //전표채번오류
        return -1;
    }

    var vs_max = 0, vi_row = 0;
    var vs_qty, vs_jnpcrt, vs_prc, vs_amt, vs_ioamt, vn_yebi3;

    if (input_Mode == 'I') {
        for (vi_row = 0; vi_row < this.ds_master.rowcount; vi_row++) {
            vs_qty = this.ds_master.getColumn(vi_row, "IOREQTY");
            vs_ioamt = this.ds_master.getColumn(vi_row, "IOAMT");
            vs_jnpcrt = this.ds_master.getColumn(vi_row, "JNPCRT");
            if (NXCore.isEmpty(vs_jnpcrt)) {
                this.gf_message_chk("250", this.gf_get_trans_word("처리구분")); //불량창고를 등록하십시오.
                this.gf_cursor_setting(this.grd_master, vi_row, "JNPCRT");
                return -1;
            }

            vs_max++;

            this.ds_master.setColumn(vi_row, "IOGBN", "O41");
            this.ds_master.setColumn(vi_row, "IOJPNO", vs_jpno + this.gf_NumToStr(vs_max, 3));
            this.ds_master.setColumn(vi_row, "CRT_USER", application.gvs_userid);
            this.ds_master.setColumn(vi_row, "SUDAT", vs_sdate);
            this.ds_master.setColumn(vi_row, "CVCOD", vs_cvcod);
            this.ds_master.setColumn(vi_row, "DEPOT_NO", vs_depot);

            vs_prc = this.ds_master.getColumn(vi_row, "IOPRC");
            vs_amt = this.ds_master.getColumn(vi_row, "IOAMT");

            this.ds_master.setColumn(vi_row, "IOQTY", vs_qty);
            this.ds_master.setColumn(vi_row, "IOAMT", vs_amt);
            this.ds_master.setColumn(vi_row, "INSDAT", vs_sdate);
            this.ds_master.setColumn(vi_row, "IO_CONFIRM", vs_iocnf);

            if (vs_iocnf == 'Y')
                this.ds_master.setColumn(vi_row, "IO_DATE", vs_sdate);

            this.ds_master.setColumn(vi_row, "INSEMP", application.gvs_userid);
            this.ds_master.setColumn(vi_row, "YEBI1", vs_sdate);
            this.ds_master.setColumn(vi_row, "SAUPJ", this.fvs_saupcode);
            this.ds_master.setColumn(vi_row, "INPCNF", "I");
            this.ds_master.setColumn(vi_row, "QCGUB", "1");

            //불량반품인 경우 입고창고에서 불량창고로 출고, 입고 2건의 수불을 발생시킴
            if (this.ds_master.getColumn(vi_row, "JNPCRT") == '057')
                this.ff_FaultInsert(vs_jpno + this.gf_NumToStr(vs_max, 3), vs_buljpno, vi_row);

            this.ds_master.setColumn(vi_row, "GODQTY", vs_qty);
            this.ds_master.setColumn(vi_row, "GODDAT", vs_sdate);
            this.ds_master.setColumn(vi_row, "GODPRC", vs_prc);
            this.ds_master.setColumn(vi_row, "GODAMT", vs_amt);
            this.ds_master.setColumn(vi_row, "LCLGBN", 'V');
            this.ds_master.setColumn(vi_row, "NAP_EMP", vs_nap_emp);

            var vs_itnbr = this.ds_master.getColumn(vi_row, "ITNBR");

            for (var j = 0; j < this.ds_detail.rowcount; j++) {
                var vs_itnbr2 = this.ds_detail.getColumn(j, "ITNBR");
                if (vs_itnbr == vs_itnbr2) {
                    this.ds_detail.setColumn(j, "IOJPNO", vs_jpno + this.gf_NumToStr(vs_max, 3));
                    this.ds_detail.setColumn(j, "IOJPSEQ", j + 1);
                    this.ds_detail.setColumn(j, "SUDAT", vs_sdate);
                }

                var vs_lot_no = this.ds_detail.getColumn(j, "LOT_NO");

                //로트번호별 허가번호 저장
                var vs_sql = "SELECT 1 AS CNT FROM ITEMAS_LOT_LCS WHERE ITNBR = '" + vs_itnbr2 + "' AND LOT_NO = '" + vs_lot_no + "' ";
                this.gf_SelectSql_sync("ds_temp: " + vs_sql, "SELECT_TEMP", "ff_Callback", 0);


                if (NXCore.isEmpty(this.ds_temp.getColumn(0, "CNT")) || this.ds_temp.getColumn(0, "CNT") < 1) {
                    vs_sql = "SELECT LCS_NO FROM ITEMAS_LCS_NO WHERE ITNBR = '" + vs_itnbr2 + "' AND TODATE >= '" + vs_sdate + "' AND ROWNUM = 1 ORDER BY FRDATE";
                    this.gf_SelectSql_sync("ds_temp: " + vs_sql, "SELECT_TEMP", "ff_Callback", 0);

                    vs_sql = "INSERT INTO ITEMAS_LOT_LCS(ITNBR,LOT_NO,LCS_NO,COMPANYCODE) VALUES "
                        + " ( '" + vs_itnbr2 + "', "
                        + " '" + vs_lot_no + "', "
                        + " '" + this.ds_temp.getColumn(i, "LCS_NO") + "', "
                        + " '10') "
                    this.gf_UpdateSql_sync(vs_sql, 'INSERT_SQL', "ff_Callback", 0);
                }
            }



        }
        // 		this.ds_head.setColumn(this.ds_head.rowposition, "ARG_IOJPNO", vs_jpno);

        this.ff_Tran("SAVE_MASTER");
        // 		this.ff_Tran("SAVE_DETAIL");
        // 		this.ff_Tran("SAVE_IMHIST");
    }
}

//--------------------------------------------------------------------
// 불량반품인 경우 입고창고에서 불량창고로 출고, 입고 2건의 수불을 발생시킴
//--------------------------------------------------------------------
this.ff_FaultInsert = function (
    vIpjpno, 
    vNewjpno, 
    vRow) {
    var vn_row = this.ds_head.rowposition;
    var vs_depot = this.ds_head.getColumn(vn_row, "ARG_DEPOT");
    var vs_sdate = this.ds_head.getColumn(vn_row, "ARG_SDATE");
    var vs_baddepot = this.ds_head.getColumn(vn_row, "ARG_DEPOTBAD");

    var vs_itnbr = this.ds_master.getColumn(vRow, "ITNBR");
    var vs_prc = this.ds_master.getColumn(vRow, "IOPRC");
    var vs_qty = this.ds_master.getColumn(vRow, "IOREQTY");
    var vs_amt = this.ds_master.getColumn(vRow, "IOAMT");
    var vs_remark = this.ds_master.getColumn(vRow, "BIGO");
    var vs_cunit = this.ds_master.getColumn(vRow, "YEBI2");
    var vs_loteno = this.ds_master.getColumn(vRow, "LOTENO");

    var vn_jpno = this.ds_imhist.getMax("IOJPNO");
    if (NXCore.isEmpty(vn_jpno))
        vn_jpno = vNewjpno + this.gf_NumToStr(0, 3);

    /****************************** 원본코드 STA ******************************
    // 입고 창고에서 불량 창고로 출고 (수불구분 'O05')
    var vn_outrow = this.ds_imhist.addRow();
    
        this.ds_imhist.setColumn(vn_outrow, "IOJPNO", parseInt(vn_jpno) + 1);
        this.ds_imhist.setColumn(vn_outrow, "IOGBN", "O05");
        this.ds_imhist.setColumn(vn_outrow, "ITNBR", vs_itnbr);
        this.ds_imhist.setColumn(vn_outrow, "PSPEC", '.');
        this.ds_imhist.setColumn(vn_outrow, "OPSEQ", '9999');
        this.ds_imhist.setColumn(vn_outrow, "DEPOT_NO", vs_depot);
        this.ds_imhist.setColumn(vn_outrow, "CVCOD", vs_baddepot);
        this.ds_imhist.setColumn(vn_outrow, "SUDAT", vs_sdate);
        this.ds_imhist.setColumn(vn_outrow, "INSDAT", vs_sdate);
        this.ds_imhist.setColumn(vn_outrow, "IO_DATE", vs_sdate);
    //	this.ds_imhist.setColumn(vn_outrow, "YEBI1", vs_sdate);
        this.ds_imhist.setColumn(vn_outrow, "IOPRC", vs_prc);
        this.ds_imhist.setColumn(vn_outrow, "IOQTY", vs_qty);
        this.ds_imhist.setColumn(vn_outrow, "IOREQTY", vs_qty);
        this.ds_imhist.setColumn(vn_outrow, "IOAMT", vs_amt);
        this.ds_imhist.setColumn(vn_outrow, "YEBI2", vs_cunit);
        this.ds_imhist.setColumn(vn_outrow, "DYEBI3", 0);	
        this.ds_imhist.setColumn(vn_outrow, "CRT_USER", application.gvs_userid);
        this.ds_imhist.setColumn(vn_outrow, "INSEMP", application.gvs_userid);
        this.ds_imhist.setColumn(vn_outrow, "IO_EMPNO", application.gvs_userid);
        this.ds_imhist.setColumn(vn_outrow, "LOTENO", vs_loteno);
        this.ds_imhist.setColumn(vn_outrow, "IP_JPNO", vIpjpno);
        this.ds_imhist.setColumn(vn_outrow, "SAUPJ", this.fvs_saupcode);
        this.ds_imhist.setColumn(vn_outrow, "INPCNF", "O");
        this.ds_imhist.setColumn(vn_outrow, "FILSK", "Y");
        this.ds_imhist.setColumn(vn_outrow, "IO_CONFIRM", 'Y');
        this.ds_imhist.setColumn(vn_outrow, "QCGUB", "1");
        this.ds_imhist.setColumn(vn_outrow, "JNPCRT", "057");
        this.ds_imhist.setColumn(vn_outrow, "BIGO", vs_remark);
    //	this.ds_imhist.setColumn(vn_outrow, "GODQTY", vs_qty);
    //	this.ds_imhist.setColumn(vn_outrow, "GODDAT", vs_sdate);
    //	this.ds_imhist.setColumn(vn_outrow, "GODPRC", vs_prc);
    //	this.ds_imhist.setColumn(vn_outrow, "GODAMT", vs_amt);
        this.ds_imhist.setColumn(vn_outrow, "LCLGBN", 'V');
    
        // 제품창고->불량창고 입고자료..
        var vn_inrow = this.ds_imhist.addRow();
    
        this.ds_imhist.copyRow(vn_inrow, this.ds_imhist, vn_outrow);
    
        vn_jpno = this.ds_imhist.getMax("IOJPNO");
        this.ds_imhist.setColumn(vn_inrow, "IOJPNO", parseInt(vn_jpno) + 1);
        this.ds_imhist.setColumn(vn_inrow, "IOGBN", "I11");
        this.ds_imhist.setColumn(vn_inrow, "DEPOT_NO", vs_baddepot);
        this.ds_imhist.setColumn(vn_inrow, "CVCOD", vs_depot);
        this.ds_imhist.setColumn(vn_inrow, "QCGUB", "1");
        this.ds_imhist.setColumn(vn_inrow, "IO_DATE", vs_sdate);
        this.ds_imhist.setColumn(vn_inrow, "INSDAT", vs_sdate);
        this.ds_imhist.setColumn(vn_inrow, "INSEMP", application.gvs_userid);
        this.ds_imhist.setColumn(vn_inrow, "INPCNF", "I");
        this.ds_imhist.setColumn(vn_inrow, "FILSK", "Y");
        this.ds_imhist.setColumn(vn_inrow, "JNPCRT", "057");
        this.ds_imhist.setColumn(vn_inrow, "DYEBI3", 0);	
    //	this.ds_imhist.setColumn(vn_inrow, "GODQTY", vs_qty);
    //	this.ds_imhist.setColumn(vn_inrow, "GODDAT", vs_sdate);
    //	this.ds_imhist.setColumn(vn_inrow, "GODPRC", vs_prc);
    //	this.ds_imhist.setColumn(vn_inrow, "GODAMT", vs_amt);
        this.ds_imhist.setColumn(vn_inrow, "LCLGBN", 'V');
    ****************************** 원본코드 END ******************************/
    /****************************** 수정코드 STA ******************************/
    // 입고 창고에서 불량 창고로 출고 (수불구분 'O05')
    var vn_outrow = this.ds_imhist.addRow();

    this.ds_imhist.setColumn(vn_outrow, "IOJPNO", parseInt(vn_jpno) + 1);
    this.ds_imhist.setColumn(vn_outrow, "IOGBN", "O05");
    this.ds_imhist.setColumn(vn_outrow, "ITNBR", vs_itnbr);
    this.ds_imhist.setColumn(vn_outrow, "PSPEC", '.');
    this.ds_imhist.setColumn(vn_outrow, "OPSEQ", '9999');
    this.ds_imhist.setColumn(vn_outrow, "DEPOT_NO", vs_depot);
    this.ds_imhist.setColumn(vn_outrow, "CVCOD", vs_baddepot);
    this.ds_imhist.setColumn(vn_outrow, "SUDAT", vs_sdate);
    this.ds_imhist.setColumn(vn_outrow, "INSDAT", vs_sdate);
    this.ds_imhist.setColumn(vn_outrow, "IO_DATE", null);
    this.ds_imhist.setColumn(vn_outrow, "IOPRC", vs_prc);
    this.ds_imhist.setColumn(vn_outrow, "IOQTY", vs_qty);
    this.ds_imhist.setColumn(vn_outrow, "IOREQTY", vs_qty);
    this.ds_imhist.setColumn(vn_outrow, "IOAMT", vs_amt);
    this.ds_imhist.setColumn(vn_outrow, "YEBI2", vs_cunit);
    this.ds_imhist.setColumn(vn_outrow, "DYEBI3", 0);
    this.ds_imhist.setColumn(vn_outrow, "CRT_USER", application.gvs_userid);
    this.ds_imhist.setColumn(vn_outrow, "INSEMP", application.gvs_userid);
    this.ds_imhist.setColumn(vn_outrow, "IO_EMPNO", application.gvs_userid);
    this.ds_imhist.setColumn(vn_outrow, "LOTENO", vs_loteno);
    this.ds_imhist.setColumn(vn_outrow, "IP_JPNO", vIpjpno);
    this.ds_imhist.setColumn(vn_outrow, "SAUPJ", this.fvs_saupcode);
    this.ds_imhist.setColumn(vn_outrow, "INPCNF", "O");
    this.ds_imhist.setColumn(vn_outrow, "FILSK", "Y");
    this.ds_imhist.setColumn(vn_outrow, "IO_CONFIRM", 'N');
    this.ds_imhist.setColumn(vn_outrow, "QCGUB", "1");
    this.ds_imhist.setColumn(vn_outrow, "JNPCRT", "057");
    this.ds_imhist.setColumn(vn_outrow, "BIGO", vs_remark);
    this.ds_imhist.setColumn(vn_outrow, "LCLGBN", 'V');

    // 제품창고->불량창고 입고자료..
    var vn_inrow = this.ds_imhist.addRow();

    this.ds_imhist.copyRow(vn_inrow, this.ds_imhist, vn_outrow);

    vn_jpno = this.ds_imhist.getMax("IOJPNO");
    this.ds_imhist.setColumn(vn_inrow, "IOJPNO", parseInt(vn_jpno) + 1);
    this.ds_imhist.setColumn(vn_inrow, "IOGBN", "I11");
    this.ds_imhist.setColumn(vn_inrow, "DEPOT_NO", vs_baddepot);
    this.ds_imhist.setColumn(vn_inrow, "CVCOD", vs_depot);
    this.ds_imhist.setColumn(vn_inrow, "INPCNF", "I");
    /****************************** 수정코드 END ******************************/
}

//--------------------------------------------------------------------
// 필수 입력 항목 check
//--------------------------------------------------------------------
this.ff_required_chk = function (sSvcID) {
    // 조회(R), 삭제(D), 저장(S) 에서 필수 값 체크 
    // 가능하면 HEAD, MASTER까지 모두 여기서 체크, 처리 해주세요.	
    switch (sSvcID) {
        case "SELECT_MASTER":	//조회
            if (input_Mode == 'I') {
                this.gf_message_chk("101869", "");	//신규등록 상태에서는 조회 불가능 합니다.
                return false;
            }

            var vs_iojpno = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_IOJPNO");
            if (NXCore.isEmpty(vs_iojpno)) {
                this.gf_message_chk("102814", ""); //전표번호를 입력하십시오.
                this.div_head.edt_iojpno.setFocus();
                return false;
            }
            break;

        case "ADD_MASTER":		//추가
            // 반품일자
            var vs_sdate = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_SDATE");
            if (NXCore.isEmpty(vs_sdate)) {
                this.gf_message_chk("102346", ""); //일자를 등록하십시오.
                this.div_head.cal_sdate.setFocus();
                return false;
            }

            // 계약처
            var vs_cvcod = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_CVCOD");
            if (NXCore.isEmpty(vs_cvcod)) {
                this.gf_message_chk("100303", ""); //거래처를 등록하십시오.
                this.div_head.edt_cvcod.setFocus();
                return false;
            }

            // 입고창고
            var vs_depot = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_DEPOT");
            if (NXCore.isEmpty(vs_depot)) {
                this.gf_message_chk("102418", ""); //입고창고를 지정하십시오.
                this.div_head.cbo_depot.setFocus();
                return false;
            }

            // 불량창고
            var vs_depotbad = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_DEPOTBAD");
            if (NXCore.isEmpty(vs_depotbad)) {
                this.gf_message_chk("101305", ""); //불량창고를 등록하십시오.
                this.div_head.cbo_depotbad.setFocus();
                return false;
            }

            // 납품담당자
            if (fvs_nap == 'Y') {
                var vs_nap_emp = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_NAP_EMP");
                if (NXCore.isEmpty(vs_nap_emp)) {
                    this.gf_message_chk("200", this.gf_get_trans_word("납품담당자"));  //필수입력 항목입니다.
                    this.div_head.edt_nap_empno.setFocus();
                    return false;
                }
            }
            break;

        case "DELETE_MASTER":	//삭제
            var vs_sdate = this.ds_head.getColumn(this.ds_head.rowposition, "AGR_SDATE");
            var vs_sql = " SELECT NVL(COUNT(*), 0) AS CO "
                + "  FROM JUNPYO_CLOSING "
                + " WHERE JPGU  = 'G0'  "
                + "   AND JPDAT >= SUBSTR('" + vs_sdate + "',0,6) ";
            this.gf_SelectSql_sync("ds_temp : " + vs_sql, "CO_SELECT", "ff_Callback");
            if (this.vi_ErrorCode < 0) return false;

            if (this.ds_temp.getColumn(0, "CO") >= 1) {
                this.gf_message_chk("101044", ""); //매출마감이 되었습니다.
                return false;
            }
            break;

        case "SAVE_MASTER":		//저장
            // MASTER
            for (var i = 0; i < this.ds_master.rowcount; i++) {
                // 반품일자
                var vs_sudat = this.ds_master.getColumn(i, "SUDAT");
                if (NXCore.isEmpty(vs_sudat)) {
                    //자료를 입력하십시요.	필수입력항목이므로 반드시 입력해야 합니다!!
                    this.gf_message_chk("200", this.gf_get_trans_word("반품일자"));
                    this.gf_cursor_setting(this.grd_master, i, "SUDAT");
                    return false;
                }

                // 계약처
                var vs_custno = this.ds_master.getColumn(i, "CUST_NO");
                if (NXCore.isEmpty(vs_custno)) {
                    //자료를 입력하십시요.	필수입력항목이므로 반드시 입력해야 합니다!!
                    this.gf_message_chk("200", this.gf_get_trans_word("계약처"));
                    this.gf_cursor_setting(this.grd_master, i, "CUST_NO");
                    return false;
                }

                // 형번
                var vs_itnbr = this.ds_master.getColumn(i, "ITNBR");
                if (NXCore.isEmpty(vs_itnbr)) {
                    //자료를 입력하십시요.	필수입력항목이므로 반드시 입력해야 합니다!!
                    this.gf_message_chk("200", this.gf_get_trans_word("형번"));
                    this.gf_cursor_setting(this.grd_master, i, "ITNBR");
                    return false;
                }

                // LOT NO
                //var vs_lotno  = this.ds_master.getColumn(i, "LOTENO");
                //if (NXCore.isEmpty(vs_lotno))
                //{
                //자료를 입력하십시요.	필수입력항목이므로 반드시 입력해야 합니다!!
                //this.gf_message_chk("200", this.gf_get_trans_word("LOT NO"));
                //this.gf_cursor_setting(this.grd_master, i, "LOTENO");
                //return false;
                //	this.ds_master.setColumn(i,"LOTENO",'.');
                //}

                // 처리구분
                var vs_jnpcrt = this.ds_master.getColumn(i, "JNPCRT");
                if (NXCore.isEmpty(vs_jnpcrt)) {
                    //자료를 입력하십시요.	필수입력항목이므로 반드시 입력해야 합니다!!
                    this.gf_message_chk("200", this.gf_get_trans_word("처리구분"));
                    this.gf_cursor_setting(this.grd_master, i, "JNPCRT");
                    return false;
                }

                // 반품사유
                var vs_gucod = this.ds_master.getColumn(i, "GUCOD");
                if (NXCore.isEmpty(vs_gucod)) {
                    //자료를 입력하십시요.	필수입력항목이므로 반드시 입력해야 합니다!!
                    this.gf_message_chk("200", this.gf_get_trans_word("반품사유"));
                    this.gf_cursor_setting(this.grd_master, i, "GUCOD");
                    return false;
                }

                // 수량
                var vn_iqty = this.ds_master.getColumn(i, "IOREQTY");
                if (NXCore.isEmpty(vn_iqty) || vn_iqty == 0) {
                    this.gf_message_chk("101708", "");	//수량을 입력하십시오.
                    this.gf_cursor_setting(this.grd_master, i, "IOREQTY");
                    return false;
                }
            }

            // DETAIL
            for (var i = 0; i < this.ds_detail.rowcount; i++) {
                var vs_loteno = this.ds_detail.getColumn(i, "LOT_NO");
                if (NXCore.isEmpty(vs_loteno)) {
                    this.ds_detail.setColumn(i, "LOT_NO", ".");
                }
            }
            break;
    }

    return true;
}

//--------------------------------------------------------------------
// datawindow 변경 funtion
//--------------------------------------------------------------------
this.ff_input_mode = function (sMode) {
    input_Mode = sMode;
    this.ff_load();
}

//--------------------------------------------------------------------
// 트란잭션 처리
//--------------------------------------------------------------------
this.ff_Tran = function (strSvcId) {
    switch (strSvcId) {
        case "SELECT_MASTER":
            this.ds_master_1.clearData();
            this.ds_detail.clearData();

            // 넘겨줄 파라메터 셋팅
            v_SvcAct = "sm/sale/sm_sale_sendback_e_1q.jsp";
            v_InDataset = "ds_para=ds_head";     	// 반드시 기술할것
            v_OutDataset = "ds_master_1=output1";	// 반드시 output1으로 기술할것
            v_Argument = "";
            break;

        case "SELECT_DETAIL":
            this.ds_detail.clearData();

            this.ds_head.setColumn(this.ds_head.rowposition, "IOJPNO", this.ds_master_1.getColumn(this.ds_master_1.rowposition, "IOJPNO"));

            // 넘겨줄 파라메터 셋팅
            v_SvcAct = "sm/sale/sm_sale_sendback_e_2q.jsp";
            v_InDataset = "ds_para=ds_head";	// 반드시 기술할것
            v_OutDataset = "ds_detail=output1";	// 반드시 output1으로 기술할것
            v_Argument = "";
            break;

        case "SAVE_MASTER":
            v_SvcAct = "sm/sale/sm_sale_sendback_e_1tr.jsp";
            v_InDataset = "input1=ds_master:U input2=ds_imhist:U input3=ds_detail:U";	// 반드시 input1으로 기술할것
            v_OutDataset = "";
            break;

        //         case "SAVE_IMHIST" :
        // 		    v_SvcAct		= "sm/sale/sm_sale_sendback_e_1tr.jsp";
        // 			v_InDataset		= "input1=ds_imhist:U";	// 반드시 input1으로 기술할것
        // 			v_OutDataset	= "";
        //			break;

        //         case "SAVE_DETAIL" :
        // 		    v_SvcAct		= "sm/sale/sm_sale_sendback_e_3tr.jsp";
        // 			v_InDataset		= "input1=ds_detail:U";	// 반드시 input1으로 기술할것
        // 			v_OutDataset	= "";
        //			break;

        // 		 case "SAVE_MOD" :
        // 		    v_SvcAct		= "sm/sale/sm_sale_sendback_e_2tr.jsp";
        // 			v_InDataset		= "input1=ds_master_1:U";	// 반드시 input1으로 기술할것
        // 			v_OutDataset	= "";
        // 		 	break;
    }
    this.gf_Transaction_Async(strSvcId, v_SvcAct, v_InDataset, v_OutDataset, "ff_Callback");
}

//--------------------------------------------------------------------
// 콜백 함수 처리
//--------------------------------------------------------------------
this.ff_Callback = function (sSvcID, ErrorCode, ErrorMsg) {
    this.vi_ErrorCode = ErrorCode;	// 콜백루틴의 에러코드	싱크트란잭션일경우 사용
    this.vs_ErrorMsg = ErrorMsg;	// 콜백루틴의 에러메세지	싱크트란잭션일경우 사용

    if (ErrorCode < 0) {
        NXCore.alert('CallBack SVCID = ' + sSvcID + '  ErrorCode = ' + ErrorCode + ' MSG = ' + ErrorMsg);
        return;
    }

    switch (sSvcID) {
        case "SELECT_MASTER":
            if (this.ds_master_1.rowcount < 1) {
                this.gf_message_chk("110", "");	//조회 및 출력할 자료가 없습니다.
            }
            //this.ff_Tran("SELECT_DETAIL");
            break;

        case "SAVE_MASTER":
            this.gf_message_chk("140", "");	//정상적으로 자료가 저장되었습니다.
            this.ds_master.clearData();
            this.ds_detail.clearData();
            this.ds_imhist.clearData();
            break;

        case "DELETE_SQL":
            this.ff_Tran("SELECT_MASTER");
            break;

        // 		case "SAVE_MOD":			
        // 			this.gf_message_chk("140", "");	//정상적으로 자료가 저장되었습니다.
        // 			if (this.ds_master_1.rowcount == 0) this.ff_SetCondition(); 
        // 			this.ff_Tran("SELECT_DETAIL");
        // 			break;
    }
}

//--------------------------------------------------------------------
// pupup의 콜백함수 처리
//--------------------------------------------------------------------
this.ff_AfterPopup = function (strId, obj) {
    var va_data = this.gf_popup_data(obj);	// popup 에서 넘어온 data 를 array 로 받아온다.

    //if (!va_data) return;  // 자료 없음 

    switch (strId) {
        // 		case "popup_object_custno":	//계약처
        // 			for (var i=0; i<va_data.length; i++) 
        // 			{
        // 				if (i == 0) vi_row = this.ds_master.rowposition;
        // 				this.ds_master.setColumn(vi_row, 'CUST_NO', va_data[i][0]);
        // 				this.ds_master.setColumn(vi_row, 'CUSTNM',  va_data[i][3]);
        // 			}
        // 			break;

        case "popup_object_estno":	//계약번호
        // 			for (var i=0; i<va_data.length; i++)
        // 			{
        // 				var vs_cvcod = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_CVCOD");
        // 				var vs_Itnbr = this.ds_master.getColumn(this.ds_master.rowposition, "ITNBR");
        // 				
        // 				if (!NXCore.isEmpty(va_data[i][0]))
        // 				{
        // 					this.ds_master.setColumn(this.ds_master.rowposition, 'ESTNO', va_data[i][0]);
        // 															
        // 					var	vs_sql = "SELECT * FROM TABLE(PKG_SALE_016.PKG_SALE_016_DANGA('V04N00'||'" + va_data[i][0] + "'||'^'||'" + vs_Itnbr + "'||'^'||'" + vs_Itnbr + "'||'^'||'" + application.gv_lang + "'||'^')) ";
        // 					this.gf_SelectSql_sync("ds_temp: " + vs_sql, "SELECT_TEMP", "ff_Callback", 0);
        // 					if (this.vi_ErrorCode < 0) return false;
        // 
        // 					if (NXCore.isEmpty(this.ds_temp.getColumn(0, "MSG")))
        // 					{
        // 						vn_danamt = this.ds_temp.getColumn(0, "BASE_PRICE");
        // 						
        // 						if (this.ds_temp.getColumn(0, "GBN") == '1')	//계산기준 1:할인율, 2:지정단가, 3:소비자단가
        // 							vs_dangbn = '2';
        // 						else
        // 							vs_dangbn = '3';
        // 
        // 						this.ds_master.setColumn(this.ds_master.rowposition, "IOPRC", vn_danamt);
        // 						this.ds_master.setColumn(this.ds_master.rowposition, "IOAMT", this.ds_master.getColumn(this.ds_master.rowposition, "IOREQTY") * vn_danamt);	
        // 						var va_taxamt = this.gfn_get_taxamt(this.fvs_companycode, this.ds_master.getColumn(this.ds_master.rowposition, "ITNBR"), this.ds_master.getColumn(this.ds_master.rowposition, "IOREQTY") * vn_danamt);
        // 						var vn_prc = va_taxamt[0];
        // 						var vn_vat = va_taxamt[1];
        // 
        // 						this.ds_master.setColumn(this.ds_master.rowposition, "UNPRC",  parseFloat(vn_prc));
        // 						this.ds_master.setColumn(this.ds_master.rowposition, "DYEBI3", parseFloat(vn_vat));
        // 					}		
        // 					else
        // 					{
        // 						this.ds_master.set_enableevent(false);
        // 
        // 						this.ds_master.setColumn(this.ds_master.rowposition, "IOPRC",  0);
        // 						this.ds_master.setColumn(this.ds_master.rowposition, "IOAMT",  0);
        // 						this.ds_master.setColumn(this.ds_master.rowposition, "UNPRC",  0);
        // 						this.ds_master.setColumn(this.ds_master.rowposition, "DYEBI3", 0);
        // 
        // 						this.ds_master.set_enableevent(true);
        // 
        // 						this.gf_message_chk("102042", this.ds_temp.getColumn(0, "MSG"));	// MSG_TXT2 : 오류가 발생했습니다.
        // 
        // 						return;
        // 					}
        // 				}
        // 				else
        // 				{
        // 					var vs_sql = "SELECT * FROM TABLE(PKG_SALE_004.PKG_SALE_004_BUYRATE('V05N00'||'" + vs_Itnbr + "'||'^'||'" + this.fvs_companycode + "'||'^'||TO_CHAR(SYSDATE, 'yyyymmdd')||'^'||'" + fvs_ivs_curr + "'||'^'||'" + '0' + "'||'^')) ";
        // 					this.gf_SelectSql_sync("ds_temp: " + vs_sql, "SELECT_PKG_SALE_004", "ff_Callback", 0);
        // 					if (this.vi_ErrorCode < 0) return false;
        // 
        // 					if (this.ds_temp.rowcount != 0)
        // 					{
        // 						this.ds_master.set_enableevent(false);
        // 						this.ds_master.setColumn(this.ds_master.rowposition, "IOPRC",  this.ds_temp.getColumn(0, "AMOUNT"));
        // 						this.ds_master.setColumn(this.ds_master.rowposition, "UNPRC",  this.ds_temp.getColumn(0, "UNPRC"));
        // 						this.ds_master.setColumn(this.ds_master.rowposition, "DYEBI3", this.ds_temp.getColumn(0, "VATAMT"));
        // 						this.ds_master.set_enableevent(true);
        // 					}
        // 				}
        // 			}
        // 			break;

        // 		case "popup_master_lotno":	//LOT NO
        // 			var vi_row;
        // 			var vs_cvcod = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_CVCOD");
        // 			var vs_cvnas = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_CVNAS");
        // 
        // 			for (var i=0; i<va_data.length; i++) 
        // 			{
        // 				if (i == 0)
        // 				{
        // 					vi_row = this.ds_master.rowposition;
        // 					this.ds_master.setColumn(vi_row, 'CVCOD',   vs_cvcod);
        // 					this.ds_master.setColumn(vi_row, 'CUST_NO', vs_cvcod);
        // 					this.ds_master.setColumn(vi_row, 'CUSTNM',  vs_cvnas);
        // 				}
        // 				else
        // 				{
        // 					vi_row = this.ds_master.addRow();
        // 					this.ds_master.setColumn(vi_row, 'CVCOD',   vs_cvcod);
        // 					this.ds_master.setColumn(vi_row, 'CUST_NO', vs_cvcod);
        // 					this.ds_master.setColumn(vi_row, 'CUSTNM',  vs_cvnas);
        // 				}
        // 
        // 				this.ds_master.setColumn(vi_row, "ITNBR",   va_data[i][0]);
        // 				this.ds_master.setColumn(vi_row, "ITDSC",   va_data[i][1]);
        // 				this.ds_master.setColumn(vi_row, "ISPEC",   va_data[i][2]);
        // 				this.ds_master.setColumn(vi_row, "LOTENO",  va_data[i][6]);
        // 				this.ds_master.setColumn(vi_row, "IOREQTY", va_data[i][7]);
        // 
        // 				// 단가
        // 				var vs_sql  = "SELECT fun_erp100000012_CUNIT('" + vs_sdate + "', '" + vs_cvcod + "', ITNBR) AS YEBI2, "
        // 					vs_sql += " 	  fun_erp100000012_3('" + vs_sdate + "', '" + vs_cvcod + "', ITNBR, "
        // 					vs_sql += "       fun_erp100000012_cunit(to_char(sysdate,'yyyymmdd'), '" + vs_cvcod + "', ITNBR) ) AS IOPRC "
        // 					vs_sql += "  FROM ITEMAS "
        // 					vs_sql += " WHERE ITNBR = '" + va_data[i][0] + "' "
        // 					vs_sql += "   AND GBWAN = 'Y'             "
        // 					vs_sql += "   AND USEYN = '0'             ";
        // 					this.gf_SelectSql_sync("ds_temp : " + vs_sql, "ITEMAS_SELECT", "ff_Callback");
        // 					if (this.vi_ErrorCode < 0) return; 
        // 
        // 					if (this.ds_temp.rowcount == 0) 
        // 					{
        // 						this.ds_master.setColumn(vi_row, "IOPRC",   0);
        // 						this.ds_master.setColumn(vi_row, "IOREQTY", 0);
        // 						this.ds_master.setColumn(vi_row, "IOAMT",   0);
        // 					}
        // 					else
        // 					{
        // 						this.ds_master.setColumn(vi_row, "PSPEC", '.');
        // 						this.ds_master.setColumn(vi_row, "IOPRC", this.ds_temp.getColumn(0, "IOPRC"));
        // 						this.ds_master.setColumn(vi_row, "YEBI2", this.ds_temp.getColumn(0, "YEBI2"));
        // 
        // 						if (!NXCore.isEmpty(this.ds_master.getColumn(vi_row, "IOREQTY")))
        // 						{
        // 							vn_amt = this.gfn_get_calcamt(this.ds_temp.getColumn(0, "IOPRC") * this.ds_master.getColumn(vi_row, "IOREQTY"), fvs_9x, fvn_9y);
        // 							this.ds_master.setColumn(vi_row, "IOAMT", vn_amt);
        // 						}
        // 					}
        // 			}
        // 			break;

        case "popup_object_cvcod":	//계약처
            for (var i = 0; i < va_data.length; i++) {
                this.ds_head.setColumn(this.ds_head.rowposition, 'ARG_CVCOD', va_data[i][0]);
                this.ds_head.setColumn(this.ds_head.rowposition, 'ARG_CVNAS', va_data[i][3]);
            }
            break;

        case "popup_object_nap_empno":	//담당
            for (var i = 0; i < va_data.length; i++) {
                this.ds_head.setColumn(this.ds_head.rowposition, 'ARG_NAP_EMP', va_data[i][0]);
                this.ds_head.setColumn(this.ds_head.rowposition, 'ARG_NAP_EMPNAME', va_data[i][1]);
            }
            break;

        // 		case "popup_object_itnbr":	//형번
        // 			var vi_row;
        // 			var vs_cvcod = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_CVCOD");
        // 			var vs_cvnas = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_CVNAS");
        // 			
        // 			for (var i=0; i<va_data.length; i++) 
        // 			{
        // 				if (i == 0)
        // 					vi_row = this.ds_master.rowposition;
        // 				else
        // 					vi_row = this.ds_master.addRow();
        // 
        // 				this.ds_master.setColumn(vi_row, "CVCOD",   vs_cvcod);
        // 				this.ds_master.setColumn(vi_row, 'CUST_NO', vs_cvcod);
        // 				this.ds_master.setColumn(vi_row, 'CUSTNM',  vs_cvnas);
        // 				
        // 				if (va_data[i][0] == 0)
        // 				{
        // 					this.ds_master.setColumn(vi_row, 'ITNBR',  va_data[i][1]);
        // 					this.ds_master.setColumn(vi_row, 'PRODNM', va_data[i][11]);
        // 					this.ds_master.setColumn(vi_row, 'LOTENO', '');
        // 				}
        // 				else
        // 				{
        // 					this.ds_master.setColumn(vi_row, 'ITNBR',   va_data[i][4]);
        // 					this.ds_master.setColumn(vi_row, 'IOREQTY', va_data[i][10]);
        // 					this.ds_master.setColumn(vi_row, 'IOPRC',   va_data[i][11]);
        // 					this.ds_master.setColumn(vi_row, 'IOAMT',   va_data[i][12]);
        // 					this.ds_master.setColumn(vi_row, 'LOTENO',  va_data[i][15]);
        // 					this.ds_master.setColumn(vi_row, 'UNPRC',   va_data[i][23]);
        // 					this.ds_master.setColumn(vi_row, 'DYEBI3',  va_data[i][22]);
        // 					this.ds_master.setColumn(vi_row, 'PRODNM',  va_data[i][21]);
        // 				}
        // 				vi_row = vi_row + 1;
        // 			}
        // 			break;

        case "popup_object_iojpno":	//반품번호
            for (var i = 0; i < va_data.length; i++) {
                this.ds_head.setColumn(this.ds_head.rowposition, 'ARG_IOJPNO', va_data[i][0]);
                this.ds_head.setColumn(this.ds_head.rowposition, 'ARG_CVCOD', va_data[i][2]);
                this.ds_head.setColumn(this.ds_head.rowposition, 'ARG_CVNAS', va_data[i][3]);
                this.ds_head.setColumn(this.ds_head.rowposition, 'ARG_SDATE', va_data[i][4]);

                // 납품담당자
                var vs_sql1 = "SELECT A.NAP_EMP AS NAP_EMP FROM IMHIST_SAL A WHERE A.IOJPNO LIKE '" + va_data[i][0].substr(0, 12) + "%' AND ROWNUM = 1 ";
                this.gf_SelectSql_sync("ds_stemp : " + vs_sql1, "NAP_SELECT", "ff_Callback");
                if (this.vi_ErrorCode < 0) return;

                if (this.ds_stemp.rowcount == 0)
                    this.ds_head.setColumn(this.ds_head.rowposition, "ARG_NAP_EMP", "");
                else
                    this.ds_head.setColumn(this.ds_head.rowposition, "ARG_NAP_EMP", this.ds_stemp.getColumn(0, "NAP_EMP"));

                this.ff_Tran("SELECT_MASTER");
            }
            break;

        case "popup_excel_upload":
            this.ff_excel_upload(va_data);
            break;
    }
}

//-----------------------------------------------------------------
// 자료변경
//-----------------------------------------------------------------
this.ff_Object_onitemchanged = function (obj: Object, e) {
    var vs_data;	//이벤트에서 데이터 값
    var vs_sql;		//Sql의 값
    var vi_row;		//해당 row 값
    var vn_amt;

    // dataset과 다른 object로 나눠서 처리
    // obj를 dataset를 확인 해서 처리 함.	
    if (obj == '[object Dataset]') {
        vi_row = e.row;
        vs_data = e.newvalue;

        // dataset 이름 별로 처리 
        if (obj.id == 'ds_master') {
            switch (e.columnid) {
                case 'IOPRC':
                    if (vs_data < 0) {
                        this.gf_message_chk("100760", ""); //단가는 -를 입력할 수 없습니다.
                        return;
                    }

                    if (NXCore.isEmpty(vs_data) || vs_data == 0) {
                        this.gf_message_chk("100761", ""); //단가를 입력하십시오.
                        return;
                    }

                    if (fvs_iogbn == 'O18' && vs_data > 0) {
                        if (this.gf_message_chk("121927", "") == "0") return;	//출고당시 무상출고건이었습니다. 계속하시겠습니까?
                        return;
                    }

                    var vs_qty = this.ds_master.getColumn(vi_row, "IOREQTY");
                    vn_amt = this.gfn_get_calcamt(vs_data * vs_qty, fvs_9x, fvn_9y);
                    this.ds_master.setColumn(vi_row, "IOAMT", vn_amt);
                    break;

                case 'IOREQTY':
                    if (NXCore.isEmpty(vs_data) || vs_data == 0) {
                        this.gf_message_chk("101701", ""); //수량값이 없습니다.
                        return;
                    }

                    if (vs_data < 0) {
                        this.gf_message_chk("101703", ""); //수량은 -를 입력할 수 없습니다.
                        return;
                    }

                    var vs_prc = this.ds_master.getColumn(vi_row, "IOPRC");
                    vn_amt = this.gfn_get_calcamt(vs_data * vs_prc, fvs_9x, fvn_9y);
                    this.ds_master.setColumn(vi_row, "IOAMT", vn_amt);
                    break;

                case 'JNPCRT':
                    for (var i = this.ds_master.rowcount - 1; i >= 0; i--) {
                        this.ds_master.setColumn(i, "JNPCRT", this.ds_master.getColumn(this.ds_master.rowposition, "JNPCRT"));
                    }
                    break;

                case 'GUCOD':
                    for (var i = this.ds_master.rowcount - 1; i >= 0; i--) {
                        this.ds_master.setColumn(i, "GUCOD", this.ds_master.getColumn(this.ds_master.rowposition, "GUCOD"));
                    }
                    break;

                // 				case 'CUST_NO' :
                // 					if (NXCore.isEmpty(vs_data)) 
                // 					{
                // 						this.ds_master.setColumn(vi_row, "CUSTNM", "");
                // 						this.gf_cursor_setting(this.grd_master, vi_row, "CUST_NO");
                // 						return;
                // 					}
                // 
                // 					var vs_sql = "SELECT A.CVNAS2 FROM VNDMST A WHERE A.CVCOD = '" + vs_data + "' AND ROWNUM = 1";
                // 					this.gf_SelectSql_sync("ds_temp : " + vs_sql, "CVCOD_SELECT", "ff_Callback");
                // 					if (this.vi_ErrorCode < 0) return; 
                // 					
                // 					if (this.ds_temp.rowcount == 0) 
                // 					{
                // 						this.gf_message_chk("100288", ""); // 거래처 코드가 존재하지 않습니다.
                // 						this.ds_master.setColumn(vi_row, 'CUST_NO', '');
                // 						this.ds_master.setColumn(vi_row, 'CUSTNM',  '');
                // 						this.gf_cursor_setting(this.grd_master, vi_row, "CUST_NO");
                // 						return;
                // 					}
                // 					else 
                // 					{
                // 						this.ds_master.setColumn(vi_row, "CUSTNM", this.ds_temp.getColumn(0, "CVNAS2"));
                // 					} 
                // 					break;

                // 				case 'CUSTNM':
                // 					var vs_sql  = " SELECT COUNT(*) AS CNT FROM VNDMST "
                // 						vs_sql += "  WHERE ( CVNAS LIKE '%'||UPPER('" + vs_data +"')||'%' OR CVNAS2 LIKE '%'||UPPER('" + vs_data +"')||'%') AND CVSTATUS = '0' ";
                // 					this.gf_SelectSql_sync("ds_temp : " + vs_sql, "CVCOD_SELECT", "ff_Callback");
                // 					if (this.vi_ErrorCode < 0) return; 
                // 
                // 					if (this.ds_temp.getColumn(0, "CNT") == 0)
                // 					{
                // 						this.gf_message_chk("190", this.gf_get_trans_word("거래처명")); // 코드 오류 
                // 						this.ds_master.setColumn(vi_row, "CUST_NO", "");
                // 						this.ds_master.setColumn(vi_row, "CUSTNM",  "");
                // 						return;
                // 					}
                // 					else if (this.ds_temp.getColumn(0, "CNT") == 1)
                // 					{
                // 						vs_sql  = " SELECT CVCOD, CVNAS FROM VNDMST "
                // 						vs_sql += "  WHERE ( CVNAS LIKE '%'||UPPER('" + vs_data + "')||'%' OR CVNAS2 LIKE '%'||UPPER('" + vs_data + "')||'%') AND CVSTATUS = '0' ";
                // 						this.gf_SelectSql_sync("ds_temp : " + vs_sql, "CVCOD_SELECT", "ff_Callback");
                // 						if (this.vi_ErrorCode < 0) return; 
                // 
                // 						this.ds_master.setColumn(vi_row, "CUST_NO", this.ds_temp.getColumn(0, "CVCOD"));
                // 						this.ds_master.setColumn(vi_row, "CUSTNM",  this.ds_temp.getColumn(0, "CVNAS"));
                // 					}
                // 					else if (this.ds_temp.getColumn(0, "CNT") > 1)
                // 					{
                // 						vs_arg = '1' + "|" + '' +  "|" + vs_data + "|" + 'N' + "|" + this.fvs_saupcode;
                // 						var resultForm = this.gf_showPopup("popup_object_custno",  "co_popu::co_popu_vndmst_f.xfdl", {width:10, height:20},
                // 							{	OpenRetv:   'Y',   	// popup open 즉시 조회  
                // 								MultSelect: 'N',   	// MULTI LINE 선택
                // 								Argument:   vs_arg	// 조회조건 파라메터 
                // 							}, {callback:	"ff_AfterPopup"});
                // 					}
                // 					break;

                // 				case 'ITNBR':
                // 					var vs_cvcod = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_CVCOD");
                // 					var vs_sdate = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_SDATE");
                // 
                // 					var vs_sql = "SELECT ITDSC, "
                // 							+ "        ISPEC, "
                // 							+ "        JIJIL, "
                // 							+ "        ITTYP, "
                // 							+ "        UNMSR, "
                // 							+ "        FILSK, "
                // 							+ "        FUN_GET_ITMBUY_ITNBR('" + vs_data + "', '" + vs_cvcod + "', '1') AS ITMBUY, "
                // 							+ "        PRODNM "
                // 							+ "   FROM ITEMAS "
                // 							+ "  WHERE ITNBR = '" + vs_data + "' "
                // 							+ "    AND GBWAN = 'Y'             "
                // 							+ "    AND USEYN = '0'             ";
                // 					this.gf_SelectSql_sync("ds_temp : " + vs_sql, "ITEMAS_SELECT", "ff_Callback");
                // 					if (this.vi_ErrorCode < 0) return;
                // 
                // 					if (this.ds_temp.rowcount == 0) 
                // 					{
                // 						this.gf_message_chk("190", this.gf_get_trans_word("형번")); // 코드 오류 
                // 
                // 						this.ds_master.setColumn(vi_row, "ITNBR",  "");
                // 						this.ds_master.setColumn(vi_row, "ITDSC",  "");
                // 						this.ds_master.setColumn(vi_row, "PRODNM", "");
                // 						this.ds_master.setColumn(vi_row, "ISPEC",  "");
                // 						this.ds_master.setColumn(vi_row, "UNMSR",  "");
                // 						this.ds_master.setColumn(vi_row, "PSPEC",  "");
                // 						this.ds_master.setColumn(vi_row, "BUNBR",  "");
                // 						this.ds_master.setColumn(vi_row, "IOPRC",   0);
                // 						this.ds_master.setColumn(vi_row, "IOREQTY", 0);
                // 						this.ds_master.setColumn(vi_row, "IOAMT",   0);
                // 					}
                // 					else
                // 					{
                // 						var vs_sql = "SELECT * FROM TABLE(PKG_SALE_004.PKG_SALE_004_BUYRATE('V05N00'||'" + vs_data + "'||'^'||'" + this.fvs_companycode + "'||'^'||TO_CHAR(SYSDATE, 'yyyymmdd')||'^'||'" + fvs_ivs_curr + "'||'^'||'" + 0 + "'||'^')) ";
                // 						this.gf_SelectSql_sync("ds_stemp: " + vs_sql, "SELECT_PKG_SALE_004", "ff_Callback", 0);
                // 						if (this.vi_ErrorCode < 0) return false;
                // 
                // 						if (this.ds_stemp.rowcount != 0)
                // 						{
                // 							this.ds_master.set_enableevent(false);
                // 							this.ds_master.setColumn(vi_row, "IOPRC",  this.ds_stemp.getColumn(0, "AMOUNT"));
                // 							this.ds_master.setColumn(vi_row, "UNPRC",  this.ds_stemp.getColumn(0, "UNPRC"));
                // 							this.ds_master.setColumn(vi_row, "DYEBI3", this.ds_stemp.getColumn(0, "VATAMT"));
                // 							this.ds_master.set_enableevent(true);
                // 						}
                // 						this.ds_master.setColumn(vi_row, "ITDSC",  this.ds_temp.getColumn(0, "ITDSC"));
                // 						this.ds_master.setColumn(vi_row, "ISPEC",  this.ds_temp.getColumn(0, "ISPEC"));
                // 						this.ds_master.setColumn(vi_row, "JIJIL",  this.ds_temp.getColumn(0, "JIJIL"));
                // 						this.ds_master.setColumn(vi_row, "FILSK",  this.ds_temp.getColumn(0, "FILSK"));						
                // 						this.ds_master.setColumn(vi_row, "UNMSR",  this.ds_temp.getColumn(0, "UNMSR"));
                // 						this.ds_master.setColumn(vi_row, "PSPEC",  '.');
                // 						this.ds_master.setColumn(vi_row, "BUNBR",  this.ds_temp.getColumn(0, "ITMBUY"));
                // 						this.ds_master.setColumn(vi_row, "PRODNM", this.ds_temp.getColumn(0, "PRODNM"));
                // 						this.ds_master.setColumn(vi_row, "YEBI2",  fvs_ivs_curr);
                // 					}
                // 					break;

                // 				case 'ITDSC' :
                // 					var vs_sql  = " SELECT COUNT(*) AS CNT FROM ITEMAS "
                // 						vs_sql += "  WHERE ITDSC LIKE '%'||UPPER('" + vs_data + "')||'%'  AND USEYN = '0' ";
                // 					this.gf_SelectSql_sync("ds_temp : " + vs_sql, "ITNBR_SELECT", "ff_Callback");
                // 					if (this.vi_ErrorCode < 0) return; 
                // 					
                // 					if (this.ds_temp.getColumn(0, "CNT") == 0)
                // 					{
                // 						this.gf_message_chk("190", this.gf_get_trans_word("품명")); // 코드 오류 
                // 						this.ds_master.setColumn(vi_row, "ITNBR", "");
                // 						this.ds_master.setColumn(vi_row, "ITDSC", "");
                // 						return;
                // 					}
                // 					else if (this.ds_temp.getColumn(0, "CNT") == 1)
                // 					{
                // 						vs_sql  = " SELECT ITNBR, ITDSC  FROM ITEMAS "
                // 						vs_sql += "  WHERE ITDSC LIKE '%'||UPPER('" + vs_data + "')||'%' AND USEYN = '0' ";
                // 						this.gf_SelectSql_sync("ds_temp : " + vs_sql, "ITNBR_SELECT", "ff_Callback");
                // 						if (this.vi_ErrorCode < 0) return; 
                // 
                // 						this.ds_master.setColumn(vi_row, "ITNBR", this.ds_temp.getColumn(0, "ITNBR"));
                // 						this.ds_master.setColumn(vi_row, "ITDSC", this.ds_temp.getColumn(0, "ITDSC"));
                // 					}
                // 					else if (this.ds_temp.getColumn(0, "CNT") > 1)
                // 					{
                // 						var vs_cvcod = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_CVCOD");
                // 						var vs_cvnas = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_CVNAS");
                // 						
                // 						vs_arg = '1|' + this.ds_head.getColumn(this.ds_head.rowposition, "ARG_SAUPJ") + '|' + vs_cvcod + '|' + vs_cvnas + '|' + vs_data;
                // 						var resultForm = this.gf_showPopup("popup_object_itnbr", "co_popu::co_popu_orderitem_f.xfdl", {width:10, height:20},
                // 							{	OpenRetv:   'Y',   	// popup open 즉시 조회  
                // 								MultSelect: 'Y',   	// MULTI LINE 선택
                // 								Argument:	vs_arg  // 조회조건 파라메터 
                // 							}, {callback:	"ff_AfterPopup"});
                // 					}
                // 					break;
            }
        } else if (obj.id == 'ds_detail') {
            switch (e.columnid) {
                case 'LOT_NO':
                    if (this.ds_detail.getColumn(vi_row, "LOTTYPE") == 'Y') { return; }

                    var vs_lotseq = this.ds_detail.getColumn(vi_row, "LOT_ST_SEQ");
                    var vs_cvcod = this.ds_head.getColumn(0, "ARG_CVCOD");
                    var vs_lotno = vs_data;
                    var vs_itnbr, vn_ioprc, vn_ioqty;
                    if (NXCore.isEmpty(vs_lotno) || vs_lotno == '') { return; }
                    if (NXCore.isEmpty(vs_lotseq) || vs_lotseq == '') {
                        alert("LOTSEQ를 입력해주세요.");
                        this.ds_detail.setColumn(vn_row, "LOT_NO", "");
                        return;
                    }
                    var vs_sql = "SELECT IOPRC, IOGBN, DYEBI3, IOQTY, SUDAT, UNPRC, ORDER_NO, ESTNO, SUGUGB ";
                    vs_sql += "  FROM ( SELECT A.IOPRC, A.IOGBN, A.DYEBI3, B.IOQTY, A.SUDAT, A.UNPRC, A.ORDER_NO, A.ESTNO, ";
                    vs_sql += "                ( SELECT SUGUGB FROM SORDER WHERE ORDER_NO = A.ORDER_NO ) AS SUGUGB ";
                    vs_sql += "           FROM IMHIST_SAL A, ";
                    vs_sql += "                ( SELECT IOJPNO, IOQTY ";
                    vs_sql += "                    FROM IMHIST_SAL_LOT ";
                    vs_sql += "                   WHERE LOT_NO = '" + vs_lotno + "' ";
                    vs_sql += "                     AND LOT_ST_SEQ = " + vs_lotseq + ") B ";
                    vs_sql += "          WHERE A.IOJPNO = B.IOJPNO ";
                    vs_sql += "            AND A.IOGBN <> 'O41' ";
                    vs_sql += "            AND A.CVCOD = '" + vs_cvcod + "' ";
                    vs_sql += "		     ORDER BY A.IOJPNO DESC ) ";
                    vs_sql += " WHERE ROWNUM = 1 ";
                    this.gf_SelectSql_sync("ds_stemp : " + vs_sql, "IOJPNO_SELECT", "ff_Callback");
                    if (this.vi_ErrorCode < 0) return;
                    vn_ioqty = this.ds_stemp.getColumn(0, "IOQTY");
                    vn_ioprc = this.ds_stemp.getColumn(0, "IOPRC");
                    var vn_vatamt = this.ds_stemp.getColumn(0, "DYEBI3");
                    var vs_sudat = this.ds_stemp.getColumn(0, "SUDAT");
                    var vn_unprc = this.ds_stemp.getColumn(0, "UNPRC");
                    fvs_iogbn = this.ds_stemp.getColumn(0, "IOGBN");
                    /////////////////////////////출고 건 있을경우 END
                    if (this.ds_stemp.rowcount < 1)//출고 이력 없을 경우
                    {
                        vs_sql = "SELECT COUNT(*) AS CNT, MAX(SUDAT) AS SUDAT ";
                        vs_sql += "  FROM COMP_SEND_HIST ";
                        vs_sql += " WHERE COMPANYCODE = '" + this.fvs_companycode + "' ";
                        vs_sql += "   AND LOT_NO = '" + vs_lotno + "' ";
                        vs_sql += "   AND LOT_ST_SEQ = " + vs_lotseq + " ";
                        this.gf_SelectSql_sync("ds_stemp : " + vs_sql, "IOJPNO_SELECT", "ff_Callback");
                        if (this.vi_ErrorCode < 0) return;

                        if (this.ds_stemp.getColumn(0, "CNT") == 0) {
                            if (this.gf_message_chk("121925", "") == "0") return;//출고자료가 없습니다, 계속하시겠습니까?
                            vs_sudat = this.ds_head.getColumn(0, "ARG_SDATE");
                        }
                        else {
                            vs_sudat = this.ds_stemp.getColumn(0, "SUDAT");
                        }
                    }/////////////////////////////출고 건 없을경우 END
                    var vs_chulday = this.gf_adddays(vs_sudat, fvs_chulday);
                    if (this.ds_head.getColumn(0, "ARG_SDATE") > vs_chulday) {
                        if (this.gf_message_chk("121929", "") == "0") return; // 반품허용기간을 초과하였습니다. 계속하시겠습니까?
                    }
                    var vs_sql = "SELECT B.ITNBR AS ITNBR, B.PRODNM AS PRODNM, B.ITDSC AS ITDSC, B.ISPEC AS ISPEC FROM STOCK_LOT A, ITEMAS B WHERE A.ITNBR = B.ITNBR AND A.LOTENO = '" + vs_lotno + "'";
                    this.gf_SelectSql_sync("ds_temp: " + vs_sql, "SELECT_LOT", "ff_Callback", 0);
                    if (this.ds_temp.getColumn(0, "CNT") == 0) {
                        alert('LOT번호에 맞는 형번을 찾을 수 없습니다.');
                        this.ds_detail.setColumn(vi_row, "LOT_NO", '');
                        return;
                    }
                    vs_itnbr = this.ds_temp.getColumn(0, "ITNBR");
                    var vs_find_d = this.ds_detail.findRowExpr("ITNBR == '" + vs_itnbr + "' && LOT_NO == '" + vs_lotno + "' && LOT_ST_SEQ == " + vs_lotseq, 0, this.ds_detail.rowcount);
                    if (vs_find_d == -1) {


                        var vn_insrow = vi_row;

                        this.ds_detail.setColumn(vn_insrow, "LOTTYPE", "N");
                        this.ds_detail.setColumn(vn_insrow, "ITNBR", vs_itnbr);
                        this.ds_detail.setColumn(vn_insrow, "PRODNM", this.ds_temp.getColumn(0, "PRODNM"));
                        this.ds_detail.setColumn(vn_insrow, "ITDSC", this.ds_temp.getColumn(0, "ITDSC"));
                        this.ds_detail.setColumn(vn_insrow, "ISPEC", this.ds_temp.getColumn(0, "ISPEC"));
                        this.ds_detail.setColumn(vn_insrow, "ORDER_NO", NXCore.empty(this.ds_stemp.getColumn(0, "ORDER_NO"), ''));
                        this.ds_detail.setColumn(vn_insrow, "LOT_NO", vs_lotno);
                        this.ds_detail.setColumn(vn_insrow, "LOT_ST_SEQ", parseInt(vs_lotseq));
                        this.ds_detail.setColumn(vn_insrow, "LOT_ED_SEQ", parseInt(vs_lotseq));
                        this.ds_detail.setColumn(vn_insrow, "MAKE_DATE", '');
                        this.ds_detail.setColumn(vn_insrow, "VALI_TERM", '');
                        if (NXCore.isEmpty(vn_ioqty) || vn_ioqty == 0) vn_ioqty = 1;
                        this.ds_detail.setColumn(vn_insrow, "IOQTY", vn_ioqty);
                        this.ds_detail.setColumn(vn_insrow, "REMAIN_MM", '');

                    }
                    else {
                        this.gf_message_chk("800", ""); //중복된 데이터입니다.
                        this.ds_detail.setColumn(vi_row, "LOT_NO", '');
                        return;
                    }

                    var vs_find = this.ds_master.findRowExpr("ITNBR == '" + vs_itnbr + "' ", 0, this.ds_master.rowcount);
                    if (vs_find == -1) {
                        this.ds_master.set_enableevent(false);

                        var vn_row = this.ds_master.addRow();
                        this.ds_master.setColumn(vn_row, "ITNBR", vs_itnbr);
                        //this.ds_master.setColumn(vn_row, "LOTENO", vs_lot);
                        this.ds_master.setColumn(vn_row, "PRODNM", this.ds_temp.getColumn(0, "PRODNM"));
                        this.ds_master.setColumn(vn_row, "ITDSC", this.ds_temp.getColumn(0, "ITDSC"));
                        this.ds_master.setColumn(vn_row, "IOPRC", vn_ioprc);
                        if (NXCore.isEmpty(vn_ioqty) || vn_ioqty == 0) vn_ioqty = 1;
                        this.ds_master.setColumn(vn_row, "IOREQTY", vn_ioqty);
                        this.ds_master.setColumn(vn_row, "IOAMT", vn_ioqty * vn_ioprc);
                        this.ds_master.setColumn(vn_row, "DYEBI3", vn_vatamt);
                        this.ds_master.setColumn(vn_row, "UNPRC", vn_unprc);
                        this.ds_master.setColumn(vn_row, "CUST_NO", vs_cvcod);
                        this.ds_master.setColumn(vn_row, "CUSTNM", this.ds_head.getColumn(0, "ARG_CVNAS"));
                        this.ds_master.setColumn(vn_row, "SUDAT", this.ds_head.getColumn(0, "ARG_SDATE"));
                        this.ds_master.setColumn(vn_row, "ISPEC", this.ds_temp.getColumn(0, "ISPEC"));
                        this.ds_master.setColumn(vn_row, "FILSK", 'Y');
                        this.ds_master.setColumn(vn_row, "PSPEC", '.');
                        this.ds_master.setColumn(vn_row, "YEBI2", fvs_ivs_curr);
                        this.ds_master.setColumn(vn_row, "ORDER_NO", NXCore.empty(this.ds_stemp.getColumn(0, "ORDER_NO"), ''));
                        this.ds_master.setColumn(vn_row, "ESTNO", NXCore.empty(this.ds_stemp.getColumn(0, "ESTNO"), ''));
                        this.ds_master.setColumn(vn_row, "SUGUGB", NXCore.empty(this.ds_stemp.getColumn(0, "SUGUGB"), ''));

                        this.ds_master.set_enableevent(true);
                    }
                    else {
                        var vn_row = vs_find;
                        this.ds_master.setColumn(vn_row, "IOREQTY", this.ds_master.getColumn(vn_row, "IOREQTY") + 1);
                    }

                    this.div_head.edt_bardata.setFocus();



                    break;
                case 'LOT_ST_SEQ':
                    var vs_lotseq = vs_data;
                    this.ds_detail.setColumn(vi_row, "LOT_ED_SEQ", vs_lotseq);
                    break;
                case 'VALI_TERM':
                    /*if(this.ds_detail.getColumn(vi_row,"LOTTYPE") == 'N')
                    {
                        var vs_day = this.gf_adddays(vs_data, -fvs_janday);
                        trace(vs_day + '///' + vs_data +'//// ' + fvs_janday);/////////////////////////////////////////////////////////////////////////////trace
                        if (fvs_today >= vs_day && fvs_today < vs_data)
                        {
                            if (this.gf_message_chk("121928", "") == "0") //유효기간이 임박했습니다. 계속하시겠습니까?
                            {
                            this.ds_detail.setColumn(vi_row, "LOT_NO", "");
                            this.ds_detail.setColumn(vi_row, "VALI_TERM", "");
                            this.ds_detail.setColumn(vi_row, "REMAIN_MM", "");
                            }
                        }
                    }else{return;}
                    */
                    if (this.ds_detail.getColumn(vn_row, "LOTTYPE") == 'N') {
                        var vs_vali_term = vs_data;
                        var resultDate;

                        if (NXCore.isEmpty(vs_vali_term) || vs_vali_term == '' || vs_vali_term == 'N/A') {
                            this.ds_detail.setColumn(vn_row, "REMAIN_MM", '9999');
                        } else {
                            var vs_day = this.gf_adddays(vs_data, -fvs_janday);
                            if (fvs_today >= vs_day && fvs_today < vs_data) {
                                if (this.gf_message_chk("121928", "") == "0") //유효기간이 임박했습니다. 계속하시겠습니까?
                                {
                                    this.ds_detail.setColumn(vi_row, "LOT_NO", "");
                                    this.ds_detail.setColumn(vi_row, "VALI_TERM", "");
                                    this.ds_detail.setColumn(vi_row, "REMAIN_MM", "");
                                    return;
                                }

                            }
                            var vs_sql2 = "SELECT MONTHS_BETWEEN(TO_DATE('" + vs_vali_term + "','YYYYMMDD') + 1, TO_DATE(TO_CHAR(SYSDATE, 'YYYYMMDD'),'YYYYMMDD') ) as REMM FROM DUAL";
                            this.gf_SelectSql_sync("ds_temp: " + vs_sql2, "SELECT_VALI_TERM", "ff_Callback", 0);
                            resultDate = nexacro.round(this.ds_temp.getColumn(0, "REMM"), 0).toString();
                            this.ds_detail.setColumn(vn_row, "REMAIN_MM", resultDate);

                        }
                    } else { return; }
                    break;
            }
        }
    }
    else {
        vs_data = e.postvalue;

        if (obj.parent.name == 'div_head') {
            vi_row = this.ds_head.rowposition;

            switch (obj.name) {
                case 'edt_cvcod':
                    if (NXCore.isEmpty(vs_data)) {
                        this.ds_head.setColumn(vi_row, "ARG_CVNAS", "");
                        return;
                    }

                    var vs_sql = "SELECT NVL(A.CVNAS2,A.CVNAS) AS CVNAS, NVL(B.RFGUB,'.') AS RFGUB FROM VNDMST A, REFFPF B "
                        + " WHERE A.CVCOD = B.RFNA2(+) AND B.RFCOD(+) = '1G' "
                        + "   AND A.CVCOD = '" + vs_data + "' AND ROWNUM = 1 ";
                    this.gf_SelectSql_sync("ds_temp : " + vs_sql, "CVCOD_SELECT", "ff_Callback");
                    if (this.vi_ErrorCode < 0) return;

                    if (this.ds_temp.rowcount == 0) {
                        this.gf_message_chk("190", this.gf_get_trans_word("거래처")); // 코드 오류 

                        this.ds_head.setColumn(this.ds_head.rowposition, "ARG_CVCOD", "");
                        this.ds_head.setColumn(this.ds_head.rowposition, "ARG_CVNAS", "");
                        this.ds_head.setColumn(this.ds_head.rowposition, "ARG_FACGBN", ".");
                        this.div_head.edt_cvcod.setFocus();  // cursor set
                        return;
                    }

                    if (this.ds_temp.getColCount(0, "RFGUB") == '.' || NXCore.isEmpty(this.ds_temp.getColCount(0, "RFGUB")))
                        this.ds_head.setColumn(this.ds_head.rowposition, "ARG_FACGBN", ".");

                    this.ds_head.setColumn(vi_row, "ARG_CVNAS", this.ds_temp.getColumn(0, "CVNAS"));
                    this.ds_head.setColumn(vi_row, "ARG_FACGBN", this.ds_temp.getColumn(0, "RFGUB"));

                    // 납품담당자
                    var vs_sql1 = "SELECT A.EMPNO FROM VNDMST_EMP A WHERE A.CVCOD = '" + vs_data + "' AND ROWNUM = 1 ";
                    this.gf_SelectSql_sync("ds_stemp : " + vs_sql1, "NAP_SELECT", "ff_Callback");
                    if (this.vi_ErrorCode < 0) return;

                    if (this.ds_stemp.rowcount == 0) {
                        this.ds_head.setColumn(vi_row, "ARG_NAP_EMP", "");
                        this.div_head.edt_nap_empno.setFocus();  // cursor set
                        return;
                    }
                    this.ds_head.setColumn(vi_row, "ARG_NAP_EMP", this.ds_stemp.getColumn(0, "EMPNO"));
                    break;

                case 'edt_cvnas':
                    var vs_sql = " SELECT COUNT(*) AS CNT FROM VNDMST "
                    vs_sql += "  WHERE ( CVNAS LIKE '%'||UPPER('" + vs_data + "')||'%' OR CVNAS2 LIKE '%'||UPPER('" + vs_data + "')||'%') AND CVSTATUS = '0' ";
                    this.gf_SelectSql_sync("ds_temp : " + vs_sql, "CVCOD_SELECT", "ff_Callback");
                    if (this.vi_ErrorCode < 0) return;

                    if (this.ds_temp.getColumn(0, "CNT") == 0) {
                        this.gf_message_chk("190", this.gf_get_trans_word("거래처명")); // 코드 오류 
                        this.ds_head.setColumn(vi_row, "ARG_CVCOD", "");
                        this.ds_head.setColumn(vi_row, "ARG_CVNAS", "");
                        return;
                    }
                    else if (this.ds_temp.getColumn(0, "CNT") == 1) {
                        vs_sql = " SELECT CVCOD, CVNAS FROM VNDMST "
                        vs_sql += "  WHERE ( CVNAS LIKE '%'||UPPER('" + vs_data + "')||'%' OR CVNAS2 LIKE '%'||UPPER('" + vs_data + "')||'%') AND CVSTATUS = '0' ";
                        this.gf_SelectSql_sync("ds_temp : " + vs_sql, "CVCOD_SELECT", "ff_Callback");
                        if (this.vi_ErrorCode < 0) return;

                        this.ds_head.setColumn(vi_row, "ARG_CVCOD", this.ds_temp.getColumn(0, "CVCOD"));
                        this.ds_head.setColumn(vi_row, "ARG_CVNAS", this.ds_temp.getColumn(0, "CVNAS"));
                    }
                    else if (this.ds_temp.getColumn(0, "CNT") > 1) {
                        vs_arg = '1' + "|" + '' + "|" + vs_data + "|" + 'S' + "|" + this.fvs_saupcode;
                        var resultForm = this.gf_showPopup("popup_object_cvcod", "co_popu::co_popu_vndmst_f.xfdl", { width: 10, height: 20 },
                            {
                                OpenRetv: 'Y',   	// popup open 즉시 조회  
                                MultSelect: 'N',   	// MULTI LINE 선택
                                Argument: vs_arg  // 조회조건 파라메터 
                            }, { callback: "ff_AfterPopup" });
                    }
                    break;

                case 'edt_nap_empno':
                    if (NXCore.isEmpty(vs_data)) {
                        this.ds_head.setColumn(vi_row, "ARG_NAP_EMPNAME", "");
                        return;
                    }
                    break;

                case 'edt_iojpno':
                    if (NXCore.isEmpty(vs_data)) return;

                    vs_sql = "SELECT SUBSTR(A.IOJPNO,1,12) AS IOJPNO, MAX(A.IO_DATE) AS IO_DATE, ";
                    vs_sql += "		  MAX(A.CVCOD) AS CVCOD, FUN_GET_CVNAS(MAX(A.CVCOD)) AS CVNAS, A.NAP_EMP ";
                    vs_sql += "  FROM IMHIST_SAL A, IOMATRIX_V X ";
                    vs_sql += " WHERE A.IOJPNO LIKE '" + vs_data + "'||'%' ";
                    vs_sql += "   AND A.IOGBN = X.IOGBN ";
                    vs_sql += "   AND FUN_IOCHOICE(X.IOCHOICE, A.IOGBN, A.JNPCRT, A.YEBI1, A.YEBI4, NULL, 'S6') = 'Y' ";
                    vs_sql += "   AND A.JNPCRT IN ('005', '057', '070') ";
                    vs_sql += " GROUP BY SUBSTR(A.IOJPNO,1,12) ";
                    this.gf_SelectSql_sync("ds_temp : " + vs_sql, "IOJPNO_SELECT", "ff_Callback");
                    if (this.vi_ErrorCode < 0) return;

                    if (this.ds_temp.rowcount == 0) {
                        this.div_head.edt_iojpno.setFocus();  // cursor set
                        this.ds_head.setColumn(vi_row, "ARG_IOJPNO", "");
                    }
                    else {
                        this.ds_head.setColumn(vi_row, "ARG_IOJPNO", this.ds_temp.getColumn(0, "IOJPNO"));
                        this.ds_head.setColumn(vi_row, "ARG_SDATE", this.ds_temp.getColumn(0, "IO_DATE"));
                        this.ds_head.setColumn(vi_row, "ARG_CVCOD", this.ds_temp.getColumn(0, "CVCOD"));
                        this.ds_head.setColumn(vi_row, "ARG_CVNAS", this.ds_temp.getColumn(0, "CVNAS"));
                        this.ds_head.setColumn(vi_row, "ARG_NAP_EMP", this.ds_temp.getColumn(0, "NAP_EMP"));
                        this.ff_Tran("SELECT_MASTER");
                    }
                    break;

                case "edt_bardata":
                    if (!this.ff_required_chk("ADD_MASTER")) return;
                    this.ff_bardatachk(vs_data, 1, 0);      ///바코드 입력 function
                    /*
                    vs_data = nexacro.replaceAll(vs_data, ':','|');
                    vs_data = nexacro.replaceAll(vs_data, "'",'|');

                    this.gf_SelectSql_sync("ds_temp: SELECT * FROM TABLE(PKG_WHM_020.PKG_FUN_WHM_020_LOT(UPPER('" + vs_data + "')))", "SELECT_TEMP", "ff_Callback", 0);
                    if (this.vi_ErrorCode < 0) return false;
                    if (NXCore.isEmpty(this.ds_temp.getColumn(0, "ITNBR")))
                    {
                        this.gf_message_chk("121897", "");	//바코드 인식에 오류가 있거나 검색할 수 없는 정보입니다.	다시 바코드 정보를 읽어보세요.
                        this.div_head.edt_bardata.setFocus();
                        return;
                    }
                    var vs_day = this.gf_adddays(this.ds_temp.getColumn(0, "VALI_TERM"), -fvs_janday);
                    if (fvs_today >= vs_day && fvs_today < this.ds_temp.getColumn(0, "VALI_TERM"))
                    {
                        if (this.gf_message_chk("121928", "") == "0") return;
                    }
                	
                    var vs_cvcod  = this.ds_head.getColumn(vi_row, "ARG_CVCOD");
                    var vs_itnbr  = this.ds_temp.getColumn(0, "ITNBR");
                    var vs_lot    = this.ds_temp.getColumn(0, "LOT_NO");
                    var vs_lotseq = this.ds_temp.getColumn(0, "LOT_SEQ");

                    var vs_sql  = "SELECT IOPRC, IOGBN, DYEBI3, IOQTY, SUDAT, UNPRC, ORDER_NO, ESTNO, SUGUGB ";
                        vs_sql += "  FROM ( SELECT A.IOPRC, A.IOGBN, A.DYEBI3, B.IOQTY, A.SUDAT, A.UNPRC, A.ORDER_NO, A.ESTNO, ";
                        vs_sql += "                ( SELECT SUGUGB FROM SORDER WHERE ORDER_NO = A.ORDER_NO ) AS SUGUGB ";
                        vs_sql += "           FROM IMHIST_SAL A, ";
                        vs_sql += "                ( SELECT IOJPNO, IOQTY ";
                        vs_sql += "                    FROM IMHIST_SAL_LOT ";
                        vs_sql += "                   WHERE LOT_NO = '" + vs_lot + "' ";
                        vs_sql += "                     AND LOT_ST_SEQ = " + vs_lotseq + ") B ";
                        vs_sql += "          WHERE A.IOJPNO = B.IOJPNO ";
                        vs_sql += "            AND A.IOGBN <> 'O41' ";
                        vs_sql += "            AND A.CVCOD = '" + vs_cvcod + "' ";
                        vs_sql += "		     ORDER BY A.IOJPNO DESC ) ";
                        vs_sql += " WHERE ROWNUM = 1 ";
                    this.gf_SelectSql_sync("ds_stemp : " + vs_sql, "IOJPNO_SELECT", "ff_Callback");
                    if (this.vi_ErrorCode < 0) return;

                    var vn_ioprc  = this.ds_stemp.getColumn(0, "IOPRC");
                    var vn_ioqty  = this.ds_stemp.getColumn(0, "IOQTY");
                    var vn_vatamt = this.ds_stemp.getColumn(0, "DYEBI3");
                    var vs_sudat  = this.ds_stemp.getColumn(0, "SUDAT");
                    var vn_unprc  = this.ds_stemp.getColumn(0, "UNPRC");
                    fvs_iogbn     = this.ds_stemp.getColumn(0, "IOGBN");

                    if (this.ds_stemp.rowcount < 1)
                    {
                        vs_sql  = "SELECT COUNT(*) AS CNT, MAX(SUDAT) AS SUDAT ";
                        vs_sql += "  FROM COMP_SEND_HIST ";
                        vs_sql += " WHERE COMPANYCODE = '" + this.fvs_companycode + "' ";
                        vs_sql += "   AND LOT_NO = '" + vs_lot + "' ";
                        vs_sql += "   AND LOT_ST_SEQ = " + vs_lotseq + " ";
                        this.gf_SelectSql_sync("ds_stemp : " + vs_sql, "IOJPNO_SELECT", "ff_Callback");
                        if (this.vi_ErrorCode < 0) return; 

                        if (this.ds_stemp.getColumn(0, "CNT") == 0)
                        {
                            if (this.gf_message_chk("121925", "") == "0") return;
                            vs_sudat =  this.ds_head.getColumn(vi_row, "ARG_SDATE");
                        }
                        else
                        {
                            vs_sudat =  this.ds_stemp.getColumn(0, "SUDAT");
                        }
                    }
                	
                	
                    var vs_chulday = this.gf_adddays(vs_sudat, fvs_chulday);
                    if (this.ds_head.getColumn(vi_row, "ARG_SDATE") > vs_chulday)
                    {
                        if (this.gf_message_chk("121929", "") == "0") return;
                    }

                    var vs_find_d = this.ds_detail.findRowExpr("ITNBR == '" + vs_itnbr + "' && LOT_NO == '" + vs_lot + "' && LOT_ST_SEQ == " + vs_lotseq, 0, this.ds_detail.rowcount);

                	
                    if (vs_find_d == -1)
                    {
                    	

                        var vn_insrow = this.ds_detail.insertRow(0);
                        this.gfn_set_zero_dataset(this.ds_detail, vn_insrow, "");

                        this.ds_detail.setColumn(vn_insrow, "ITNBR",      vs_itnbr);
                        this.ds_detail.setColumn(vn_insrow, "PRODNM",     this.ds_temp.getColumn(0, "PRODNM"));
                        this.ds_detail.setColumn(vn_insrow, "ITDSC",      this.ds_temp.getColumn(0, "ITDSC"));
                        this.ds_detail.setColumn(vn_insrow, "ISPEC",      this.ds_temp.getColumn(0, "ISPEC"));
                        this.ds_detail.setColumn(vn_insrow, "ORDER_NO",	  NXCore.empty(this.ds_stemp.getColumn(0, "ORDER_NO"), ''));
                        this.ds_detail.setColumn(vn_insrow, "LOT_NO",     vs_lot);
                        this.ds_detail.setColumn(vn_insrow, "LOT_ST_SEQ", parseInt(vs_lotseq));
                        this.ds_detail.setColumn(vn_insrow, "LOT_ED_SEQ", parseInt(vs_lotseq));
                        this.ds_detail.setColumn(vn_insrow, "MAKE_DATE",  this.ds_temp.getColumn(0, "MAKE_DATE"));
                        this.ds_detail.setColumn(vn_insrow, "VALI_TERM",  this.ds_temp.getColumn(0, "VALI_TERM"));
                        this.ds_detail.setColumn(vn_insrow, "IOQTY",      1);
                        this.ds_detail.setColumn(vn_insrow, "REMAIN_MM",  this.ds_temp.getColumn(0, "VALI_MM"));
                	
                    }
                    else
                    {
                        this.gf_message_chk("800", "");
//						this.ds_detail.deleteRow(vn_insrow);
                        this.div_head.edt_bardata.setFocus();
                        return;
                    }

                    var vs_find = this.ds_master.findRowExpr("ITNBR == '" + vs_itnbr + "' ", 0, this.ds_master.rowcount);
                    if (vs_find == -1)
                    {
                        this.ds_master.set_enableevent(false);

                        var vn_row = this.ds_master.addRow();
                        this.ds_master.setColumn(vn_row, "ITNBR", vs_itnbr);
                        this.ds_master.setColumn(vn_row, "PRODNM", this.ds_temp.getColumn(0, "PRODNM"));
                        this.ds_master.setColumn(vn_row, "ITDSC", this.ds_temp.getColumn(0, "ITDSC"));
                        this.ds_master.setColumn(vn_row, "IOPRC", vn_ioprc);
                        if (NXCore.isEmpty(vn_ioqty) || vn_ioqty == 0) vn_ioqty = 1;
                        this.ds_master.setColumn(vn_row, "IOREQTY", vn_ioqty);
                        this.ds_master.setColumn(vn_row, "IOAMT", vn_ioqty * vn_ioprc);
                        this.ds_master.setColumn(vn_row, "DYEBI3", vn_vatamt);
                        this.ds_master.setColumn(vn_row, "UNPRC", vn_unprc);
                        this.ds_master.setColumn(vn_row, "CUST_NO", vs_cvcod);
                        this.ds_master.setColumn(vn_row, "CUSTNM", this.ds_head.getColumn(vi_row, "ARG_CVNAS"));
                        this.ds_master.setColumn(vn_row, "SUDAT", this.ds_head.getColumn(vi_row, "ARG_SDATE"));
                        this.ds_master.setColumn(vn_row, "ISPEC", this.ds_temp.getColumn(0, "ISPEC"));
                        this.ds_master.setColumn(vn_row, "FILSK", 'Y');
                        this.ds_master.setColumn(vn_row, "PSPEC", '.');
                        this.ds_master.setColumn(vn_row, "YEBI2", fvs_ivs_curr);
                        this.ds_master.setColumn(vn_row, "ORDER_NO", NXCore.empty(this.ds_stemp.getColumn(0, "ORDER_NO"), ''));
                        this.ds_master.setColumn(vn_row, "ESTNO", NXCore.empty(this.ds_stemp.getColumn(0, "ESTNO"), ''));
                        this.ds_master.setColumn(vn_row, "SUGUGB", NXCore.empty(this.ds_stemp.getColumn(0, "SUGUGB"), ''));

                        this.ds_master.set_enableevent(true);
                    }
                    else
                    {
                        var vn_row = vs_find;
                        this.ds_master.setColumn(vn_row, "IOREQTY", this.ds_master.getColumn(vn_row, "IOREQTY") + 1);
                    }
*/
                    this.div_head.edt_bardata.setFocus();
                    break;
            }
        }
    }
}

//--------------------------------------------------------------------
// MOUSE RIGHT BUTTON 처리 
// 해당 objectd의 이벤트에서 "ff_Object_onrbuttondown"로 추가 
//--------------------------------------------------------------------
this.ff_Object_onrbuttondown = function (obj: Object, e: nexacro.MouseEventInfo) {
    var vs_data = e.postvalue;
    var vs_arg = '';

    if (obj.readonly) return;	//readonly 상태 이면 팝업 취소 

    // Grid과 다른 object로 나눠서 처리
    // obj가 Grid를 확인해서 처리함
    if (obj == '[object Grid]') {
        if (obj.id == 'grd_master') {
            switch (this.gf_GetCellBind(obj, e.cell, 'Body')) {
                // 				case 'ITNBR':
                // 					var vs_cvcod = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_CVCOD");
                // 					var vs_cvnas = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_CVNAS");
                // 
                // 					if (NXCore.isEmpty(vs_cvcod)) return;
                // 					vs_arg = '1|' + this.ds_head.getColumn(this.ds_head.rowposition, "ARG_SAUPJ") + '|' + vs_cvcod + '|' + vs_cvnas;
                // 
                // 					var resultForm = this.gf_showPopup("popup_object_itnbr", "co_popu::co_popu_orderitem_f.xfdl", {width:10, height:20},
                // 						{	OpenRetv:   'Y',   	// popup open 즉시 조회  
                // 							MultSelect: 'Y',   	// MULTI LINE 선택
                // 							Argument:	vs_arg	// 조회조건 파라메터 
                // 						}, {callback:	"ff_AfterPopup"});
                // 					break;

                // 				case 'CUST_NO':
                // 					vs_arg = '1' + "|" + '' + "|" + '' + "|" + 'N' + "|" + this.fvs_saupcode;
                // 					var resultForm = this.gf_showPopup("popup_object_custno", "co_popu::co_popu_vndmst_f.xfdl", {width:10, height:20},
                // 						{	OpenRetv:   'Y',   	// popup open 즉시 조회  
                // 							MultSelect: 'N',   	// MULTI LINE 선택
                // 							Argument:   vs_arg	// 조회조건 파라메터 
                // 						}, {callback:	"ff_AfterPopup"});
                // 					break;

                // 				case 'ESTNO':	//계약번호
                // 					var vs_custno = this.ds_master.getColumn(this.ds_master.rowposition, "CUST_NO");
                // 					var vs_custnm = this.ds_master.getColumn(this.ds_master.rowposition, "CUSTNM");
                // 					if (NXCore.isEmpty(vs_custno))
                // 					{
                // 						this.gf_message_chk("121798", "");	//MSG_TXT2 : 계약처(고객)는 필수입니다.
                // 						this.gf_cursor_setting(this.grd_master, this.ds_master.rowposition, "CUST_NO");
                // 						return;
                // 					}
                // 
                // 					vs_arg  = this.fvs_companycode + "|";
                // 					vs_arg += this.fvs_saupcode + "|";
                // 					vs_arg += vs_custno + '|';
                // 					vs_arg += vs_custnm;
                // 					var resultForm = this.gf_showPopup("popup_object_estno", "co_popu::co_popu_estimate_f.xfdl", {width:10, height:20},
                // 						{	OpenRetv:   'Y',   	// popup open 즉시 조회  
                // 							MultSelect: 'N',   	// MULTI LINE 선택
                // 							Argument:   vs_arg	// 조회조건 파라메터 
                // 						}, {callback:	"ff_AfterPopup"});
                // 					break;

                // 				case 'LOTENO':
                // 					var vs_saupj = this.ds_head.getColumn(0, "ARG_SAUPJ");
                // 						
                // 					var vn_Drow = this.ds_master.rowposition;
                // 					var vn_outrow = this.ds_master.getColumn(vn_Drow, "ITNBR");
                // 					var vs_Itdsc = this.ds_master.getColumn(vn_Drow, "ITDSC");
                // 					
                // 					if (NXCore.isEmpty(vn_outrow) || vn_outrow == '') vn_outrow = '';
                // 					if (NXCore.isEmpty(vs_Itdsc) || vs_Itdsc == '') vs_Itdsc = '';
                // 					
                // 					var vs_depot = this.ds_head.getColumn(0, "ARG_DEPOT");
                // 					if (NXCore.isEmpty(vs_depot) || vs_depot == '')
                // 					{
                // 						this.gf_message_chk("103256", this.gf_get_trans_word("창고"));		// 출고창고를 입력하십시오.
                // 						return;
                // 					}
                // 						
                // 					vs_arg = vs_saupj + "|" + vs_depot + "|" + vn_outrow + "|" + vs_Itdsc ;
                // 					var resultForm = this.gf_showPopup("popup_master_lotno",  "co_popu::co_popu_lotjego_f.xfdl", {width:10, height:20},
                // 						{	OpenRetv:   'Y',   	// popup open 즉시 조회  
                // 							MultSelect: 'Y',   	// MULTI LINE 선택
                // 							Argument:   vs_arg  // 조회조건 파라메터 
                // 						}, {callback:	"ff_AfterPopup"});				
                // 					break;
            }
        }
    }
    else {
        if (obj.parent.name == 'div_head') {
            var vi_row = this.ds_head.rowposition;	//데이터셋의 row 위치값
            vs_data = obj.value;

            switch (obj.name) {
                case 'edt_cvcod':
                    vs_arg = '1' + "|" + '' + "|" + '' + "|" + 'S' + "|" + this.fvs_saupcode;

                    var resultForm = this.gf_showPopup("popup_object_cvcod", "co_popu::co_popu_vndmst_f.xfdl", { width: 10, height: 20 },
                        {
                            OpenRetv: 'Y',   	// popup open 즉시 조회  
                            MultSelect: 'N',   	// MULTI LINE 선택
                            Argument: vs_arg	// 조회조건 파라메터
                        }, { callback: "ff_AfterPopup" });
                    break;

                case 'edt_nap_empno':	//담당
                    vs_arg = this.fvs_saupcode + "|" + vs_data + "|" + this.ds_head.getColumn(vi_row, "ARG_NAP_EMPNAME");
                    var resultForm = this.gf_showPopup("popup_object_nap_empno", "co_popu::co_popu_sawon_f.xfdl", { width: 10, height: 20 },
                        {
                            OpenRetv: 'Y',   	// popup open 즉시 조회  
                            MultSelect: 'N',   	// MULTI LINE 선택
                            Argument: vs_arg	// 조회조건 파라메터 
                        }, { callback: "ff_AfterPopup" });
                    break;

                case 'edt_iojpno':
                    vi_row = this.ds_head.rowposition;
                    vs_arg = '2' + '|' + this.fvs_saupcode;
                    var resultForm = this.gf_showPopup("popup_object_iojpno", "co_popu::co_popu_sendback_f.xfdl", { width: 10, height: 20 },
                        {
                            OpenRetv: 'Y',   	// popup open 즉시 조회
                            MultSelect: 'N',   	// MULTI LINE 선택
                            Argument: vs_arg	// 조회조건 파라메터
                        }, { callback: "ff_AfterPopup" });
                    break;
            }
        }
    }
}
//--------------------------------------------------------------------
// 엑셀업로드 데이터 처리
//--------------------------------------------------------------------
this.ff_excel_upload = function (vs_data) {

    var vs_data_bar, vs_data_qty, vs_data_prc;
    for (var i = 0; i < vs_data.length; i++) {
        vs_data_bar = vs_data[i][0];
        vs_data_qty = vs_data[i][1];
        vs_data_prc = vs_data[i][2];
        this.ff_bardatachk(vs_data_bar, vs_data_qty, vs_data_prc);
    }
}

//--------------------------------------------------------------------
//바코드 데이터 처리 // 바코드데이터 입력, 엑셀 업로드 후 처리
//--------------------------------------------------------------------
this.ff_bardatachk = function (vs_data, vs_qty, vs_prc) {
    //var vs_data_1 = vs_data;
    var vs_cvcod, vs_itnbr, vs_lot, vs_lotseq;

    vs_data = nexacro.replaceAll(vs_data, ':', '|');
    vs_data = nexacro.replaceAll(vs_data, "'", '|');

    this.gf_SelectSql_sync("ds_temp: SELECT * FROM TABLE(PKG_WHM_020.PKG_FUN_WHM_020_LOT(UPPER('" + vs_data + "')))", "SELECT_TEMP", "ff_Callback", 0);

    //
    var moon = this.ds_temp;
    trace("ds_temp");
    for (var i = 0; i < moon.getRowCount(); i++) {
        var rowData = "";
        for (var j = 0; j < moon.getColCount(); j++) {
            rowData += moon.getColID(i) + " : ";
            rowData += moon.getColumn(i, j) + " ";
        }
        trace(rowData);
    }
    //

    if (this.vi_ErrorCode < 0) return false;
    if (NXCore.isEmpty(this.ds_temp.getColumn(0, "ITNBR"))) {
        this.gf_message_chk("121897", "");	//바코드 인식에 오류가 있거나 검색할 수 없는 정보입니다.	다시 바코드 정보를 읽어보세요.
        this.div_head.edt_bardata.setFocus();
        return;
    }
    var vs_day = this.gf_adddays(this.ds_temp.getColumn(0, "VALI_TERM"), -fvs_janday);
    if (fvs_today >= vs_day && fvs_today < this.ds_temp.getColumn(0, "VALI_TERM")) {
        if (this.gf_message_chk("121928", "") == "0") return;//유효기간이 임박했습니다. 계속하시겠습니까?
    }

    vs_cvcod = this.ds_head.getColumn(0, "ARG_CVCOD");
    vs_itnbr = this.ds_temp.getColumn(0, "ITNBR");
    vs_lot = this.ds_temp.getColumn(0, "LOT_NO");
    vs_lotseq = this.ds_temp.getColumn(0, "LOT_SEQ");


    var vs_sql = "SELECT IOPRC, IOGBN, DYEBI3, IOQTY, SUDAT, UNPRC, ORDER_NO, ESTNO, SUGUGB ";
    vs_sql += "  FROM ( SELECT A.IOPRC, A.IOGBN, A.DYEBI3, B.IOQTY, A.SUDAT, A.UNPRC, A.ORDER_NO, A.ESTNO, ";
    vs_sql += "                ( SELECT SUGUGB FROM SORDER WHERE ORDER_NO = A.ORDER_NO ) AS SUGUGB ";
    vs_sql += "           FROM IMHIST_SAL A, ";
    vs_sql += "                ( SELECT IOJPNO, IOQTY ";
    vs_sql += "                    FROM IMHIST_SAL_LOT ";
    vs_sql += "                   WHERE LOT_NO = '" + vs_lot + "' ";
    vs_sql += "                     AND LOT_ST_SEQ = " + vs_lotseq + ") B ";
    vs_sql += "          WHERE A.IOJPNO = B.IOJPNO ";
    vs_sql += "            AND A.IOGBN <> 'O41' ";
    vs_sql += "            AND A.CVCOD = '" + vs_cvcod + "' ";
    vs_sql += "		     ORDER BY A.IOJPNO DESC ) ";
    vs_sql += " WHERE ROWNUM = 1 ";
    this.gf_SelectSql_sync("ds_stemp : " + vs_sql, "IOJPNO_SELECT", "ff_Callback");
    if (this.vi_ErrorCode < 0) return;
    var vn_ioprc, vn_ioqty;

    if (vs_qty == 1 && vs_prc == 0)		//바코드 스캔으로 직접 입력 시 수량, 단가 불러오기
    {
        vn_ioqty = this.ds_stemp.getColumn(0, "IOQTY");
        vn_ioprc = this.ds_stemp.getColumn(0, "IOPRC");
    } else {		//엑셀 업로드 시 입력한 수량, 단가 체크
        vn_ioqty = vs_qty;
        vn_ioprc = vs_prc;
    }

    var vn_vatamt = this.ds_stemp.getColumn(0, "DYEBI3");
    var vs_sudat = this.ds_stemp.getColumn(0, "SUDAT");
    var vn_unprc = this.ds_stemp.getColumn(0, "UNPRC");
    fvs_iogbn = this.ds_stemp.getColumn(0, "IOGBN");

    if (this.ds_stemp.rowcount < 1)//출고 이력 없을 경우
    {
        vn_ioqty = vs_qty;//출고이력 없을경우 null값 방지
        vn_ioprc = vs_prc;
        vs_sql = "SELECT COUNT(*) AS CNT, MAX(SUDAT) AS SUDAT ";
        vs_sql += "  FROM COMP_SEND_HIST ";
        vs_sql += " WHERE COMPANYCODE = '" + this.fvs_companycode + "' ";
        vs_sql += "   AND LOT_NO = '" + vs_lot + "' ";
        vs_sql += "   AND LOT_ST_SEQ = " + vs_lotseq + " ";
        this.gf_SelectSql_sync("ds_stemp : " + vs_sql, "IOJPNO_SELECT", "ff_Callback");
        if (this.vi_ErrorCode < 0) return;

        if (this.ds_stemp.getColumn(0, "CNT") == 0) {
            if (this.gf_message_chk("121925", "") == "0") return;//출고자료가 없습니다, 계속하시겠습니까?
            vs_sudat = this.ds_head.getColumn(0, "ARG_SDATE");
        }
        else {
            vs_sudat = this.ds_stemp.getColumn(0, "SUDAT");
        }
    }

    var vs_chulday = this.gf_adddays(vs_sudat, fvs_chulday);

    if (this.ds_head.getColumn(0, "ARG_SDATE") > vs_chulday) {
        if (this.gf_message_chk("121929", "") == "0") return; // 반품허용기간을 초과하였습니다. 계속하시겠습니까?
    }

    var vs_find_d = this.ds_detail.findRowExpr("ITNBR == '" + vs_itnbr + "' && LOT_NO == '" + vs_lot + "' && LOT_ST_SEQ == " + vs_lotseq, 0, this.ds_detail.rowcount);


    if (vs_find_d == -1) {


        var vn_insrow = this.ds_detail.insertRow(0);
        this.gfn_set_zero_dataset(this.ds_detail, vn_insrow, "");

        this.ds_detail.setColumn(vn_insrow, "LOTTYPE", "Y");
        this.ds_detail.setColumn(vn_insrow, "ITNBR", vs_itnbr);
        this.ds_detail.setColumn(vn_insrow, "PRODNM", this.ds_temp.getColumn(0, "PRODNM"));
        this.ds_detail.setColumn(vn_insrow, "ITDSC", this.ds_temp.getColumn(0, "ITDSC"));
        this.ds_detail.setColumn(vn_insrow, "ISPEC", this.ds_temp.getColumn(0, "ISPEC"));
        this.ds_detail.setColumn(vn_insrow, "ORDER_NO", NXCore.empty(this.ds_stemp.getColumn(0, "ORDER_NO"), ''));
        this.ds_detail.setColumn(vn_insrow, "LOT_NO", vs_lot);
        this.ds_detail.setColumn(vn_insrow, "LOT_ST_SEQ", parseInt(vs_lotseq));
        this.ds_detail.setColumn(vn_insrow, "LOT_ED_SEQ", parseInt(vs_lotseq));
        this.ds_detail.setColumn(vn_insrow, "MAKE_DATE", this.ds_temp.getColumn(0, "MAKE_DATE"));
        this.ds_detail.setColumn(vn_insrow, "VALI_TERM", this.ds_temp.getColumn(0, "VALI_TERM"));
        if (NXCore.isEmpty(vn_ioqty) || vn_ioqty == 0) vn_ioqty = 1;
        this.ds_detail.setColumn(vn_insrow, "IOQTY", vn_ioqty);
        this.ds_detail.setColumn(vn_insrow, "REMAIN_MM", this.ds_temp.getColumn(0, "VALI_MM"));

    }
    else {
        this.gf_message_chk("800", ""); //중복된 데이터입니다.
        //		this.ds_detail.deleteRow(vn_insrow);
        this.div_head.edt_bardata.setFocus();
        return;
    }

    //var vs_find = this.ds_master.findRowExpr("LOTENO == '" + vs_lot + "' ", 0, this.ds_master.rowcount);
    var vs_find = this.ds_master.findRowExpr("ITNBR == '" + vs_itnbr + "' ", 0, this.ds_master.rowcount);
    if (vs_find == -1) {
        this.ds_master.set_enableevent(false);

        var vn_row = this.ds_master.addRow();
        this.ds_master.setColumn(vn_row, "ITNBR", vs_itnbr);
        //this.ds_master.setColumn(vn_row, "LOTENO", vs_lot);
        this.ds_master.setColumn(vn_row, "PRODNM", this.ds_temp.getColumn(0, "PRODNM"));
        this.ds_master.setColumn(vn_row, "ITDSC", this.ds_temp.getColumn(0, "ITDSC"));
        this.ds_master.setColumn(vn_row, "IOPRC", vn_ioprc);
        if (NXCore.isEmpty(vn_ioqty) || vn_ioqty == 0) vn_ioqty = 1;
        this.ds_master.setColumn(vn_row, "IOREQTY", vn_ioqty);
        this.ds_master.setColumn(vn_row, "IOAMT", vn_ioqty * vn_ioprc);
        this.ds_master.setColumn(vn_row, "DYEBI3", vn_vatamt);
        this.ds_master.setColumn(vn_row, "UNPRC", vn_unprc);
        this.ds_master.setColumn(vn_row, "CUST_NO", vs_cvcod);
        this.ds_master.setColumn(vn_row, "CUSTNM", this.ds_head.getColumn(0, "ARG_CVNAS"));
        this.ds_master.setColumn(vn_row, "SUDAT", this.ds_head.getColumn(0, "ARG_SDATE"));
        this.ds_master.setColumn(vn_row, "ISPEC", this.ds_temp.getColumn(0, "ISPEC"));
        this.ds_master.setColumn(vn_row, "FILSK", 'Y');
        this.ds_master.setColumn(vn_row, "PSPEC", '.');
        this.ds_master.setColumn(vn_row, "YEBI2", fvs_ivs_curr);
        this.ds_master.setColumn(vn_row, "ORDER_NO", NXCore.empty(this.ds_stemp.getColumn(0, "ORDER_NO"), ''));
        this.ds_master.setColumn(vn_row, "ESTNO", NXCore.empty(this.ds_stemp.getColumn(0, "ESTNO"), ''));
        this.ds_master.setColumn(vn_row, "SUGUGB", NXCore.empty(this.ds_stemp.getColumn(0, "SUGUGB"), ''));

        this.ds_master.set_enableevent(true);
    }
    else {
        var vn_row = vs_find;
        this.ds_master.setColumn(vn_row, "IOREQTY", this.ds_master.getColumn(vn_row, "IOREQTY") + 1);
    }

    this.div_head.edt_bardata.setFocus();


}

//--------------------------------------------------------------------
// 사업장 선택시 
//--------------------------------------------------------------------
this.ff_company_saup_select = function () {
    this.fvs_companycode = this.div_head.div_company_select.cbo_companycode.value;
    this.fvs_saupcode = this.div_head.div_company_select.cbo_saupcode.value;

    this.ds_head.setColumn(this.ds_head.rowposition, "ARG_COMPCODE", this.fvs_companycode);
    this.ds_head.setColumn(this.ds_head.rowposition, "ARG_SAUPJ", this.fvs_saupcode);

    this.gf_combo_head_sync(this.ds_head, "ARG_DEPOT", this.div_head.cbo_depot, "co_dddw_depot_01", this.fvs_companycode, 0);
    this.gf_combo_head_sync(this.ds_head, "ARG_DEPOTBAD", this.div_head.cbo_depotbad, "co_dddw_depot_02", this.fvs_companycode, 0);

    this.ff_jfDepotno(this.fvs_saupcode);

    var va_taxinfo = this.gfn_get_taxinfo(this.fvs_companycode);	// 법인 부가정보
    fvs_ivs_curr = va_taxinfo[0];								// 법인 기본통화
    fvs_9x = va_taxinfo[1];								// 1:절사,2:반올림
    fvn_9y = va_taxinfo[2];								// 위치지정(-1:십단위, 0:원단위, 1:소수점1자리, 2:소수점2자리)
    fvn_9z = va_taxinfo[3];								// 부가세율(증치세)

    // 	if (this.fvs_saupcode == "%")
    //         this.gf_mdi_btn_disable("add");
    // 	else
    //         this.gf_mdi_btn_enable("add");

    this.ds_master.clearData();
    this.ds_master_1.clearData();
    this.ds_imhist.clearData();
    this.ds_detail.clearData();
}

//--------------------------------------------------------------------
// BAR-CODE KEYDOWN
//--------------------------------------------------------------------
this.div_head_edt_bardata_onkeydown = function (obj: Edit, e: nexacro.KeyEventInfo) {
    if (e.keycode == 13) fvs_enter = 'Y';
}

//--------------------------------------------------------------------
// BAR-CODE KILL FOCUS
//--------------------------------------------------------------------
this.div_head_edt_bardata_onkillfocus = function (obj: Edit, e: nexacro.KillFocusEventInfo) {
    if (fvs_enter == 'Y') {
        this.div_head.edt_bardata.setFocus();
        this.ds_head.setColumn(this.ds_head.rowposition, "ARG_BARDATA", '');
        //		this.div_head.edt_bardata.set_value('');
        fvs_enter = 'N';
    }
}

//--------------------------------------------------------------------
// ds_master_1 ROWFOCUSCHANGE
//--------------------------------------------------------------------
this.ds_master_1_onrowposchanged = function (obj: Dataset, e: nexacro.DSRowPosChangeEventInfo) {
    if (e.newrow == -1) return;
    this.ff_Tran("SELECT_DETAIL");
}


this.div_head_cbo_depot_onitemchanged = function (obj: Combo, e: nexacro.ItemChangeEventInfo) {
    trace(this.div_head.cbo_depot.value);
}
