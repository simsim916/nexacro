/***********************************************************************
 * 01. Creation date      : 2016.10.28
 * 02. Created by         : 박두현 
 * 03. Revision history   : 
 ***********************************************************************
 */

include "lib::common_form.xjs";
include "si_co::si_comm_function.xjs";

//--------------------------------------------------------------------
//// 인스턴스 변수 선언 부분
//--------------------------------------------------------------------
var vFocusDw, ivColname;
var ivChk, ivAllow, ivVndamt = 0, ivEstamt = 0;
var vToday, vClosedt;
var vRgn_yn;
var vRgn_Stdate, vRgn_Eddate, vRgn_Ctdate, vRgn_Msg;
var nRgn_Term, nRgn_Ratio;
//  초기값 셋팅   
var fvs_default_detail = "OUT_GU^O02@OVERSEA_GU^1@ORDER_PSPEC^.@SUJU_STS^1@MISAYU^N@AMTGU^Y@TUNCU^KRW@RCV_GUBUN^1@CRT_PGMID^1@GWSTS^00@GWGBN^N@DANGBN^3";
//fvs_default_detail+="CRT_PGMID^1@GWSTS^00@GWGBN^Y@DANGBN^3@AMT_GU^Y@DANGBN^3@TUNCU^KRW@OUT_GU^O02";
var fvs_default_trans = "TRANS_GU^01";
var fvs_default_master = "MISAYU^N@DEPOT_NO^ZS010@SUGUGB^1@GWGBN^N";

var fvs_mob_gbn = "N";
var fvs_mob_cancel = "N";
var fvs_pswd_chk = "N";

/***********************************************************************
 * Event process specification
 ************************************************************************/
// Initializing on Form onload
this.form_onload = function (obj: Form, e: nexacro.LoadEventInfo) {
    this.gf_formOnload(obj);
    this.ff_load(obj);
}

this.ff_load = function (obj) {

    this.ff_SetCondition();   // 초기 조건 파라메터 셋팅 및 콤보 셋팅
}
//------------------------------------------------------------------------------------------------ 
// 초기 조건 파라메터 셋팅 및 콤보 셋팅
//------------------------------------------------------------------------------------------------ 
this.ff_SetCondition = function () {

    vToday = this.gf_today();

    ivUserid = application.gvs_userid;
    ivEmpno = application.gvs_empid;

    vRtn = this.gsi_get_inqauth(ivUserid);
    ivLevelcd = vRtn[1];

    ivDeptcd = vRtn[2];
    ivInqdept = vRtn[3];
    ivSarea = vRtn[4];

    ivInqsarea = vRtn[5];
    ivProtect = vRtn[6];
    ivLevelcd2 = vRtn[7];
    ivDeptcd2 = vRtn[8];
    ivInqdept2 = vRtn[9];
    ivSarea2 = vRtn[10];
    ivInqsarea2 = vRtn[11];



    ivChk = '0';  // 화면모드 0 : List(조회), 1 : 신규입력, 2 : 수정 또는 삭제,

    var vSql = "SELECT FUN_GET_SALE_CLOSE_DT CLOSE_DT FROM DUAL ";
    vSql = "ds_temp : " + vSql;
    this.gf_SelectSql_sync(vSql, "SELECT_SALE_CLOSE_DT", "ff_Callback_sync", 0);
    if (vi_ErrorCode < 0) return false;
    vClosedt = this.ds_temp.getColumn(0, "CLOSE_DT");

    this.ds_head.addRow();

    this.Div_head.ed_ji_empno.set_value(ivEmpno);
    this.Div_head.ed_ji_empname.set_value(application.gvs_username);



    this.ds_master.clearData();
    this.ds_detail.clearData();

    var vs_today = this.gf_today();
    this.ds_head.setColumn(0, "ARG_EDATE", vs_today);
    this.ds_head.setColumn(0, "GUBUN", '2');
    this.ds_head.setColumn(0, "ARG_SDATE", this.gf_adddays(vs_today, -4));

    if (NXCore.isEmpty(ivInqsarea) || ivInqsarea == '') {
        ivInqsarea = '%';
    }

    if (NXCore.isEmpty(ivInqsarea2) || ivInqsarea2 == '') {
        ivInqsarea2 = '%';
    }

    this.Div_head.btn_order.set_visible(false);

    this.gf_combo_head_sync(this.ds_head, "ARG_SAREA", this.Div_head.cbo_sarea, "co_dddw_sarea_sales", ivInqsarea + '|' + ivInqsarea2, 0);
    this.gf_combo_head_sync(this.ds_head, "ARG_SAUPJ", this.Div_head.cbo_saupj, "co_dddw_reffpf_f_ad1", "", 0);
    this.Div_head.cbo_saupj.set_index(0);

    this.gf_combo_grd_sync(this.grd_list, "RCV_GUBUN", "1^WEB@2^MOBILE@3^병원STAFF", "", 0);
    this.gf_combo_grd_sync(this.grd_list, "CRT_PGMID", "1^주문접수@2^출하요청", "", 0);
    this.gf_combo_grd_sync(this.grd_list, "ESTSTS", "co_dddw_reffpf_f_5e", "", 0);		//계약상태

    this.gf_combo_head_sync(this.ds_master, "DEPOT_NO", this.Div_content.cbo_depot_no, "co_dddw_depot_07_deptemp", "%|%", 0);
    this.gf_combo_head_sync(this.ds_master, "SAUPJ", this.Div_content.cbo_saupj, "co_dddw_reffpf_f_ad1", "", 0);

    this.gf_combo_head_sync(this.ds_trans, "TRANS_GU", this.Div_content.cbo_trans_gu, "co_dddw_reffpf_f_1p", "", 0);
    this.gf_combo_head_sync(this.ds_trans, "TRANS_SAREA", this.Div_content.cbo_trans_sarea, "co_dddw_trans_area", "", 0);
    this.gf_combo_head_sync(this.ds_trans, "TRANS_CGBN", this.Div_content.cbo_trans_cgbn, "co_dddw_reffpf_f_36_y", "", 0);//택배사 구분

    this.gf_combo_head_sync(this.ds_package, "GUBUN", this.Div_content.DIV_package.cbo_gubun, "1^납품단가기준@2^패키지 계약 기준@3^소비자가 기준", "", 0);
    this.gf_combo_head_sync(this.ds_package, "CON_NEW_GBN", this.Div_content.DIV_package.cbo_con_new_gbn, "1^신규@2^재계약@3^중도 재계약", "", 0);

    this.gf_combo_grd_sync(this.gd_detail, "DANGBN", "1^계약단가@2^패키지@3^소비자가@4^사용자", "", 0);
    this.gf_combo_grd_sync(this.gd_detail, "AMTGU", "Y^유상@N^견본", "", 0);
    this.gf_combo_grd_sync(this.gd_detail, "SUJU_STS", "co_dddw_reffpf_f_51", "", 0);
    this.gf_combo_grd_sync(this.gd_detail, "PART_GBN", "Y^예@N^아니오", "", 0);
    this.gf_combo_grd_sync(this.gd_detail, "OUT_GU", "co_dddw_iomatrix_all", "", 0);


    if (NXCore.isEmpty(ivInqsarea.replace(/%/gi, '')) || ivInqsarea.replace(/%/gi, '') == '') {
        this.ds_head.setColumn(0, "ARG_SAREA", '%');
    }
    else {
        this.ds_head.setColumn(0, "ARG_SAREA", ivInqsarea.replace(/%/gi, ''));
    }


    /*if(ivInqsarea.replace(/%/gi, '') == '%' || NXCore.isEmpty(ivInqsarea.replace(/%/gi, '')) || ivInqsarea.replace(/%/gi, '') == '')
    {
        this.Div_head.cbo_sarea.set_enable(true);
    }
    else
    {
        this.Div_head.cbo_sarea.set_enable(false);
    }*/

    this.ff_Depot(application.gvs_empid);

    ///////////////////////////////////////////////////////
    /// 동종골 회수율 관련 환경 변수 Retrieve
    ///////////////////////////////////////////////////////
    var vSql, vRtn;

    for (var i = 11; i <= 15; i++) {
        vRtn = this.gf_SelectSql_sync("ds_temp: select dataname from syscnfg where sysgu = 'S' and serial = 20 and lineno = '" + this.gf_NumToStr(i, 2) + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

        if (i == 11) vRgn_Stdate = vRtn[1];
        if (i == 12) nRgn_Term = parseInt(vRtn[1]);
        if (i == 13) nRgn_Ratio = parseFloat(vRtn[1]);
        if (i == 14) vRgn_Ctdate = vRtn[1];
        if (i == 15) vRgn_Msg = vRtn[1];
    }

    vRtn = this.gf_SelectSql_sync("ds_temp: select to_char(sysdate - " + nRgn_Term + ", 'yyyymmdd') from dual ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
    vRgn_Eddate = vRtn[1];

    if (!NXCore.isEmpty(this.parent.parent.fvs_OpenRetv)) {

        vs_OpenRetv = this.parent.parent.fvs_OpenRetv;    // 넘어온 파라메터 값 
        vs_MultSelect = this.parent.parent.fvs_MultSelect;    // 넘어온 파라메터 값 
        vs_Argument = this.parent.parent.fvs_Argument;    // 넘어온 파라메터 값

        var vs_param = vs_Argument.split('|');
        var vDatagbn = vs_param[0];
        var vOrder_no = vs_param[1];
        var vEstno = vs_param[2];
        var vCvcod = vs_param[3];
        var vGwsts = vs_param[4];
        var vSuju_sts = vs_param[5];

        if (vDatagbn == '2') {

            this.ds_head.setColumn(0, "ARG_ORDER_NO", vOrder_no);

            ivChk = '2';  // 화면모드 0 : List(조회), 1 : 신규입력, 2 : 수정 또는 삭제,
            this.ff_Screen();

            this.ff_Tran_sync("SELECT_MASTER_TRANS_DETAIL");

            //if (this.ds_master.getColumn(0, "MISAYU") == 'Y') vEstno = 'Sobi';

            this.ff_Package_Reset_Inquery(vCvcod, vEstno);
            this.ff_Real_calc();   // pdh   

            this.ds_master.setColumn(0, "ESTNO", vEstno);

            this.ff_History(vCvcod);
            this.ff_LeaseSet(vEstno);

            if (this.ds_trans.rowcount == 0) {
                this.ds_trans.insertRow(0);
                this.gsi_dataset_zero_set(this.ds_trans, 0, fvs_default_trans);
                this.ds_trans.setColumn(0, "ORDER_NO", vOrder_no);
            }

            if (vSuju_sts > 0) {
                alert("접수이후에 출하진행된 정보가 있으므로 기본정보는 수정 할 수 없고 삭제도 안됩니다."
                    + " 필요하신 경우 주문승인 처리에서 건별 취소하시기 바랍니다");
                this.gf_mdi_btn_disable("delete");

                this.Div_detail.btn_detail_add.set_enable(false);
                this.Div_detail.btn_detail_delete.set_enable(false);

                this.Div_detail.btn_detail_mob_ok.set_visible(false);   // 모바일 접수 
                this.Div_detail.btn_detail_mob_cncl.set_visible(false); // 모바일 취소 
            }

            if (vGwsts > 0) {
                alert("결재진행중인 주문이므로 수정,삭제할 수 없습니다");
                this.gf_mdi_btn_disable("update,delete");

                this.Div_detail.btn_detail_add.set_enable(false);
                this.Div_detail.btn_detail_delete.set_enable(false);

                this.Div_detail.btn_detail_mob_ok.set_visible(false);     // 모바일 접수 
                this.Div_detail.btn_detail_mob_cncl.set_visible(false);   // 모바일 취소 
            }

            if (vSuju_sts > 0 || vGwsts > 0) {
                this.Div_content.ed_trans_cvcod.setFocus();
            }
            else {
                this.Div_content.ed_cvcod.setFocus();
            }
        }
        else {
            ivChk = '0';  // 화면모드 0 : List(조회), 1 : 신규입력, 2 : 수정 또는 삭제,
            this.btn_add_onclick();

            //this.ff_Screen();  
            this.ds_master.setColumn(0, "CVCOD", vCvcod);
        }
    }
    else {

        ivChk = '0';  // 화면모드 0 : List(조회), 1 : 신규입력, 2 : 수정 또는 삭제,
        this.ff_Screen();

    }
}

//------------------------------------------------------------------------------------------------ 
//화면을 닫기전에 수정사항이 있으면 저장할것인지 묻는다.
//------------------------------------------------------------------------------------------------ 
this.form_onbeforeclose = function (obj: Form, e: CloseEventInfo) {
    var vb_true = true;

    if (NXCore.isModified(this.ds_master)) {
        if (this.gf_message_chk("1180", "") == "1") return true;
    }
    return vb_true;
}
//------------------------------------------------------------------------------------------------ 
//화면 닫기
//------------------------------------------------------------------------------------------------ 
this.btn_close_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    // 	if( NXCore.isModified(this.ds_master))
    // 	{
    // 		if ( this.gf_message_chk("1180", "") == "1") return true;  // 변경된 자료가 있습니다. 취소하시겠습니까?	
    // 	}
    this.gf_closeMenu();
}

//------------------------------------------------------------------------------------------------ 
// 조회 버튼 
//------------------------------------------------------------------------------------------------ 
this.btn_query_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    if (this.ds_head.getColumn(0, "GUBUN") == '2') {
        ivChk = '0';  // 화면모드 0 : List(조회), 1 : 신규입력, 2 : 수정 또는 삭제,
        this.ff_Screen();
        this.ds_list.clearData();
        this.ds_detail.clearData();
        vToday = this.gf_today();

        //this.ff_protect_content(false);

        // 	this.Div_head.cal_sdate.set_value("20160917");
        // 	this.Div_head.cal_edate.set_value("20160921");
        // 	this.Div_head.ed_ji_empno.set_value("");



        var vSdate = this.Div_head.cal_sdate.value + "";
        var vEdate = this.Div_head.cal_edate.value + "";
        var vSarea = this.Div_head.cbo_sarea.value;
        var vSales_Empno = this.Div_head.ed_sales_empno.value;
        var vJi_Empno = this.Div_head.ed_ji_empno.value;
        var vSaupj = this.Div_head.cbo_saupj.value;
        var vCvcod = this.Div_head.ed_cvcod.value;
        var vCvnas = this.Div_head.ed_cvnas.value;
        var vCon_Cvcod = this.Div_head.ed_con_cvcod.value;
        var vCon_Cvnas = this.Div_head.ed_con_cvnas.value;
        var vCangbn = this.Div_head.chk_cangbn.value;
        /*if (this.Div_head.chk_cangbn.value) vCangbn='Y';
        else vCangbn='N';*/
        var vCrg_pgmid = '%';

        if (NXCore.isEmpty(vSdate)) vSdate = '.';
        if (NXCore.isEmpty(vEdate)) vEdate = '.';
        if (NXCore.isEmpty(vSarea)) vSarea = '%';
        if (NXCore.isEmpty(vSales_Empno)) vSales_Empno = '%';
        if (NXCore.isEmpty(vJi_Empno)) vJi_Empno = '%';
        if (NXCore.isEmpty(vSaupj)) vSaupj = '%';
        if (NXCore.isEmpty(vCvcod)) vCvcod = '%';
        if (NXCore.isEmpty(vCvnas)) vCvnas = '%';
        if (NXCore.isEmpty(vCon_Cvcod)) vCon_Cvcod = '%';
        if (NXCore.isEmpty(vCon_Cvnas)) vCon_Cvnas = '%';

        if (vCvcod != '%' && vCvcod.length > 0) vCvnas = '%';
        if (vCon_Cvcod != '%' && vCon_Cvcod.length > 0) vCon_Cvnas = '%';
        vArg = 'V13N00' + vSdate + "^" + vEdate + "^" + vSarea + "^" + vSales_Empno + "^" + vJi_Empno + "^" + vSaupj + "^" + vCvnas
            + "^" + vCrg_pgmid + "^" + vCangbn + "^" + vCvcod + "^" + vCon_Cvcod + "^" + vCon_Cvnas + "^" + "1" + "^";

        this.ds_head.setColumn(0, "ARG_DATA", vArg);
    }

    this.ds_detail.clearData();

    this.ff_Tran("SELECT_LIST");

}
//------------------------------------------------------------------------------------------------ 
// 추가 버튼 
//------------------------------------------------------------------------------------------------ 
this.btn_add_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    if (ivChk != '0') {
        if (!application.confirm("자료 입력중입니다\n계속 진행하면 현재자료는 없어집니다\n새로운 자료를 입력하시겠습니까?")) return;
    }

    ivChk = '1';

    fvs_pswd_chk = "N";  // 폐업거래처 확인 

    this.ff_protect_content(true);

    this.ds_master.clearData();
    this.ds_package.clearData();
    this.ds_trans.clearData();
    this.ds_history.clearData();
    this.ds_detail.clearData();
    var vi_row = this.ds_master.insertRow(0);
    this.gsi_dataset_zero_set(this.ds_master, vi_row, fvs_default_master);
    vi_row = this.ds_package.insertRow(0);
    this.gsi_dataset_zero_set(this.ds_package, vi_row, "GUBUN^3");
    vi_row = this.ds_trans.insertRow(0);
    this.gsi_dataset_zero_set(this.ds_trans, vi_row, fvs_default_trans);

    this.Div_detail.btn_detail_delete.set_enable(true);
    this.Div_detail.btn_detail_add.set_enable(true);

    this.Div_content.set_enable(true);
    this.gd_detail.set_cssclass('');
    this.gd_detail.set_readonly(false);

    this.Div_content.cbo_sorder_gwgbn.set_cssclass('');
    this.Div_content.cbo_sorder_gwgbn.set_readonly(false);
    this.Div_content.ed_emp_id.set_cssclass('');
    this.Div_content.ed_emp_id.set_readonly(false);
    this.Div_content.ed_order_memo.set_cssclass('');
    this.Div_content.ed_order_memo.set_readonly(false);
    this.Div_content.ed_ji_empno.set_cssclass('');
    this.Div_content.ed_ji_empno.set_readonly(false);

    this.ff_Screen();
    //this.ff_Depot(application.gvs_empid);


    this.ds_master.set_enableevent(false);
    this.ds_master.setColumn(0, "ORDER_DATE", vToday);
    this.ds_master.setColumn(0, "SAUPJ", this.ds_head.getColumn(0, "ARG_SAUPJ"));
    this.ds_master.setColumn(0, "EMP_ID", this.Div_head.ed_sales_empno.value);
    this.ds_master.setColumn(0, "SALE_EMPNAME", this.Div_head.ed_sales_empname.value);
    this.ds_master.setColumn(0, "JI_EMPNO", this.Div_head.ed_ji_empno.value);
    this.ds_master.setColumn(0, "JI_EMPNAME", this.Div_head.ed_ji_empname.value);
    this.ds_master.setColumn(0, "SAREA", this.ds_head.getColumn(0, "ARG_SAREA"));
    this.ds_master.set_enableevent(true);

    this.ds_trans.setColumn(0, "TRANS_CGBN", 'H01');

    var vSarea = this.ds_head.getColumn(0, "ARG_SAREA");

    var vJi_empno = this.Div_head.ed_ji_empno.value;
    if (!NXCore.isEmpty(vSarea)) {
        this.ff_Depot(vJi_empno);
    }
    this.Div_content.ed_cvcod.setFocus();

    this.Div_detail.btn_detail_mob_ok.set_visible(false);      // 모바일 접수
    this.Div_detail.btn_detail_mob_cncl.set_visible(false);    // 모바일 취소

    fvs_mob_gbn = "N";  // 모바일 주문이 아님 

}
//------------------------------------------------------------------------------------------------ 
// 취소 버튼  
//------------------------------------------------------------------------------------------------ 
this.btn_cancel_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    ivChk = '0';
    ivChk = '0';
    this.ds_master.clearData();
    this.ds_package.clearData();
    this.ds_history.clearData();
    this.ds_detail.clearData();

    var vs_Gubun = '2';

    if (vs_Gubun == '1') {
        //this.gd_detail.set_visible(false);				

        /*this.grd_list.set_left("2");
        this.grd_list.set_top("60");
        this.grd_list.set_width("99.69%");
        this.grd_list.set_bottom("0%");*/

        this.grd_list.setFormat("LIST_1");
        this.gd_detail.setFormat("DETAIL_1");

        this.gf_mdi_btn_disable("delete,save,cancel, excel_up");
        this.gf_mdi_btn_enable("query,excel_chg");
    }
    else {
        //this.gd_detail.set_visible(true);		

        /*this.gd_detail.set_left("2");
        this.gd_detail.set_top("67.00%");
        this.gd_detail.set_width("99.69%");
        this.gd_detail.set_bottom("0.39%");*/

        this.grd_list.set_left("2");
        this.grd_list.set_top("60");
        this.grd_list.set_width("99.69%");
        this.grd_list.set_bottom("34.00%");

        this.grd_list.setFormat("LIST_2");
        this.gd_detail.setFormat("DETAIL_2");

        this.gf_mdi_btn_disable("delete,save,cancel, excel_up");
        this.gf_mdi_btn_enable("query,excel_chg");
    }

    this.ff_Screen();

}

//--------------------------------------------------------------------
// 엑셀변환 버튼 클릭
//--------------------------------------------------------------------
this.btn_excel_up_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    if (this.ds_head.getColumn(0, "GUBUN") == '2') {
        alert('주문대기창에서만 등록 가능합니다.');
        return;
    }

    var vs_openRetv = 'Y';
    var vs_args = '';

    var vs_args = this.gf_get_trans_word(" ◎ 항목설명") + "\n"
        + this.gf_get_trans_word("	1. No. : 순번(입력 불필요)") + "\n"
        + this.gf_get_trans_word("	2. 주문일자,계약번호,거래처코드,배송지구분,우편번호,배송지주소1,배송지주소2,수령인,연락처,형번,수량,판매단가,단가구분,유무상,택배사(한진/일양)  : 입력") + "\n"
        + "\n"
        + this.gf_get_trans_word(" ◎ 주의사항") + "\n"
        + this.gf_get_trans_word("	1. 엑셀 양식을 임의로 변경불가(항목 삭제/추가 불가)");

    var resultForm = this.gf_showPopup("popup_excel_upload2", "co_popu::co_popu_excelupload_ex.xfdl", { width: 10, height: 20 },
        {
            OpenRetv: vs_openRetv,	// popup 즉시 파일찾기
            Argument: vs_args  		// 조회조건 파라메터 
        }, { callback: "ff_AfterPopup" });
}

//--------------------------------------------------------------------
// 엑셀변환 버튼 클릭
//--------------------------------------------------------------------
this.btn_excel_chg_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    if (this.ds_list.rowcount < 1) return;
    this.gf_excel_download(this.grd_list);
}

this.btn_etc1_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vRow = this.ds_list.rowposition;
    if (vRow == -1) return;

    var vCvcod = this.ds_list.getColumn(this.ds_list.rowposition, "CVCOD");


    var vs_pgrm_id = "bi_cust::bi_cust_vndmst_e.xfdl";   // <----- 호출 하고자 하는 프로그램 주소와 프로그램 id  
    var vs_arg = vCvcod;                                  // <------ 넘기고자 하는 파람메터
    var resultForm = this.gf_showPopup(vs_pgrm_id, "comm::COM_POPUP_WORKFRAME.xfdl", { width: 1500, height: 800 },
        {
            OpenRetv: 'N',       			 // popup open 즉시 조회 
            MultSelect: 'N',          		 // MULTI LINE 선택
            Argument: vs_arg,      		 // 윗 프로그램에 넘겨줄 값
            Argument_pgrm_id: vs_pgrm_id      //<---------호출하고자 하는 프로그램 id
        }, { modal: true, layered: true, autosize: false, showtitlebar: true, resizable: true, callback: "ff_AfterPopup_pgrm" });
}

this.btn_etc2_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vRow = this.ds_list.rowposition;
    if (vRow == -1) return;

    var vSdate = this.ds_list.getColumn(this.ds_list.rowposition, "ORDER_DATE");
    var vEdate = this.gf_today();
    var vCvcod = this.ds_list.getColumn(this.ds_list.rowposition, "CVCOD");
    var vCvnas = this.ds_list.getColumn(this.ds_list.rowposition, "CVNAS2");
    var vs_arg = vSdate + '|' + vEdate + '|' + vCvcod + '|' + vCvnas;
    var vs_pgrm_id = "sm_send::sm_send_chaamt_neo_e.xfdl";                                                    // <----- 호출 하고자 하는 프로그램 주소와 프로그램 id   
    var resultForm = this.gf_showPopup(vs_pgrm_id, "comm::COM_POPUP_WORKFRAME.xfdl", { width: 1500, height: 800 },
        {
            OpenRetv: 'N',   // popup open 즉시 조회  
            MultSelect: 'N',   // MULTI LINE 선택
            Argument: vs_arg,// 조회조건 파라메터 
            Argument_pgrm_id: vs_pgrm_id      //<---------호출하고자 하는 프로그램 id
        }, { modal: true, layered: true, autosize: false, showtitlebar: true, resizable: true, callback: "ff_AfterPopup_pgrm" });
}

this.btn_etc3_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vRow = this.ds_list.rowposition;
    if (vRow == -1) return;
    var vJpno = this.ds_list.getColumn(vRow, "ORDER_NO");

    this.ds_head.setColumn(0, "ARG_ORDER_NO", vJpno);

    this.ff_Tran("SELECT_PRINT");

}

this.btn_etc4_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    if (ivChk != '0') return;

    var nRow = this.ds_list.rowposition;
    if (nRow == -1) return;
    var vOrder_no = this.ds_list.getColumn(nRow, "ORDER_NO");
    var vOpenParam = new Array();
    var vs_url;
    var vResult = this.gf_SelectSql_sync("ds_temp: SELECT DECODE(NVL(C.TRANS_CGBN,'H01'), 'H01',DECODE(SUBSTR(B.DELIV_JPNO,1,1), '7', '50'||B.DELIV_JPNO, '51'||B.DELIV_JPNO), 'T01', B.DELIV_JPNO) AS JPNO,  "
        + " NVL(C.TRANS_CGBN,'H01') AS CGBN "
        + " FROM  IMHIST_SAL A, IMHIST_SAL_PK1 B, SORDER_TRANS C"
        + " WHERE A.ORDER_NO LIKE '" + vOrder_no + "'||'%' AND A.IOJPNO = B.IOJPNO AND SUBSTR(A.ORDER_NO,1,12) = C.ORDER_NO  ",
        "SELECT_SORDER_SAVE", "ff_Callback_sync", 0);

    if (!NXCore.isEmpty(vResult[1]) && vResult[1] != '') {
        if (vResult[2] == 'H01') {
            vs_url = "http://www.hanjinexpress.hanjin.net/customer/hddcw18_ms.tracking?w_num=" + vResult[1];
        } else {
            vs_url = "https://www.ilyanglogis.com/functionality/popup_cust.asp?hawb_no=" + vResult[1];
        }

        system.execBrowser(vs_url);
    }
    else {
        alert("조회할 운송장이 없습니다");
    }

    return;
}

//------------------------------------------------------------------------------------------------ 
// 저장  버튼 
//------------------------------------------------------------------------------------------------ 
this.btn_save_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {

    // 수정하는 상태에서 Picking이 될 수 있기때문에 체크
    var vUptchk = 'N';
    if (ivChk == '2') {
        var vTotqty = 0;
        for (i = 0; i < this.ds_detail.rowcount; i++) {
            vTotqty = vTotqty + this.ds_detail.getColumn(i, "ORDER_QTY");
        }

        var vOrdno = this.ds_master.getColumn(0, "ORDER_NO").substr(0, 12);
        var vRstchk = this.gf_SelectSql_sync("ds_temp: SELECT NVL(SUM(FUN_GET_HOLDSTOCK_PK_HOLD_QTY(A.ORDER_NO)), 0), "
            + "               NVL(SUM(DECODE(A.SUJU_STS, '7', 1, '8', 1, 0)), 0), "
            + "               NVL(SUM(A.INVOICE_QTY + A.OUT_QTY),0)    "
            + "  FROM SORDER A WHERE A.ORDER_NO LIKE '" + vOrdno + "'||'%'        ",
            "SELECT_SORDER_SAVE", "ff_Callback_sync", 0);
        if (vi_ErrorCode < 0) return false;
        if (vRstchk[1] != '0' || vRstchk[2] != '0') {
            vUptchk = 'Y';
        }

        if (parseFloat(vRstchk[3]) != 0) {
            vUptchk = 'Y';
        }
    }

    if (fvs_pswd_chk == "Y") {  // 폐업 거래처 
        alert("휴(폐)업 거래처는 암호 확인 후 저장할 수 있습니다.");

        var vModResult = this.gf_showPopup('PASSWORD_CHK', "co_popu::co_popu_input_f.xfdl", { width: 810, height: 500 },
            {
                Argument: "PASSWORD"  // 암호체크  
            }, { modal: true, layered: true, autosize: false, callback: "ff_AfterPswd" });

        return false;
    }

    if (vUptchk == 'Y') {
        var vOrdno = this.ds_master.getColumn(0, "ORDER_NO").substr(0, 12);
        var vEmp_id = this.ds_master.getColumn(0, "EMP_ID");
        var vJi_empno = this.ds_master.getColumn(0, "JI_EMPNO");
        var vOrder_memo = this.ds_master.getColumn(0, "ORDER_MEMO");

        alert("이 주문은 이미 Picking 또는 출고진행중인 자료입니다..\n담당,비고 및 배송정보외에는 수정할 수 없습니다..\n품목등의 정보를 수정하려면 물류팀에 Picking마감 취소를 요청하세요");
        this.ff_Tran_sync("SAVE_TRANS");
        if (vi_ErrorCode < 0) return false;
        this.gf_UpdateSql_sync("UPDATE SORDER SET EMP_ID = '" + vEmp_id + "', JI_EMPNO = '" + vJi_empno + "', ORDER_MEMO = '" + vOrder_memo + "' WHERE ORDER_NO LIKE '" + vOrdno + "'||'%' ",
            "UPDATE_SORDER", "ff_Callback_sync", 0);
        if (vi_ErrorCode < 0) return false;
        return;
    }

    var vJunpyoseq, vJpno;
    var nSeq = 0;

    var nChk = this.ff_UpdateChk();

    if (nChk == 0) {
        var vEstno = this.ds_master.getColumn(0, "ESTNO");

        if (!NXCore.isEmpty(vEstno)) {
            var nTot_chul = this.ds_package.getColumn(0, "TOT_CHUL");
            var nTot_back = this.ds_package.getColumn(0, "TOT_BACK");
            var nTot_sugum = this.ds_package.getColumn(0, "USE_SUGUM_AMOUNT");
            var nPrv_amt = this.ds_package.getColumn(0, "PRV_AMOUNT");

            var nRem_amt;

            if (ivEstamt != 0) {
                nRem_amt = ivEstamt - nTot_chul + nTot_back;
            } else {
                nRem_amt = nTot_sugum - nTot_chul + nTot_back + nPrv_amt;
            }

            var nLimit_amt = this.ds_package.getColumn(0, "LIMITAMT");
            var nInit_amt = this.ds_package.getColumn(0, "INITAMT");
            var vIpgum_type = this.ds_package.getColumn(0, "IPGUM_TYPE");

            var nOld_amt, nNew_amt, nCha_amt = 0;
            var nOrdqty;

            for (var i = 0; i < this.ds_detail.rowcount; i++) {
                nOld_amt = this.ds_detail.getColumn(i, "OLD_ORDER_AMT");
                nNew_amt = this.ds_detail.getColumn(i, "ORDER_AMT");
                nOrdqty = this.ds_detail.getColumn(i, "ORDER_QTY");


                //2018.07.27 홍성표 추가 nOld_amt 값이 들어 오지 않음.
                if (nOld_amt == null) {
                    nOld_amt = 0;
                }


                if (this.ds_detail.getRowType(i) == Dataset.ROWTYPE_INSERT ||
                    this.ds_detail.getRowType(i) == Dataset.ROWTYPE_UPDATE) {
                    nCha_amt = nCha_amt + nNew_amt - nOld_amt;
                }
                else
                    if (this.ds_detail.getRowType(i) == Dataset.ROWTYPE_DELETE) {
                        nCha_amt = nCha_amt - nOld_amt;
                    }
            }

            vSql = "SELECT TAX_GBN4, CON_SPC_GBN, CON_NEW_GBN FROM ESTIMATE_HEAD WHERE ESTNO = '" + vEstno + "'";
            vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_ESTIMATE_HEAD", "ff_Callback_sync", 0);
            if (vi_ErrorCode < 0) return false;

            /////////////////////////////////////////////////////////////////
            ///// 2015.12.07 보험 계약은 수금분 초과해도 주문 접수한다. /////
            /////                        백팀장 요청, 최실장 확인       /////
            /////////////////////////////////////////////////////////////////
            /////if (vRtn[1] != 'Y' && nCha_amt > nRem_amt) {

            if (vRtn[1] != 'Y') {
                if (vRtn[2] == '6' || vRtn[2] == '8') {
                    //////////////////////////////////////////
                }
                else
                    if (vRtn[3] != '1' && vIpgum_type != '5') {
                        if (nCha_amt > nRem_amt) {
                            alert(" 출고 가능한 금액은 " + nRem_amt.toLocaleString().slice(0, -3) + " 입니다. (기출하+주문)금액이 초과됩니다!");
                            return -1;
                        }
                    }
                    else {
                        var nMaxamt, nContamt;

                        nContamt = this.ds_package.getColumn(0, "USE_SUGUM_AMOUNT");

                        if (nLimit_amt > nInit_amt)
                            nMax_amt = nLimit_amt;
                        else nMax_amt = nInit_amt;

                        if (nMax_amt < nContamt)
                            nMax_amt = nContamt;

                        if (nMax_amt < ivEstamt && ivEstamt != 0)
                            nMax_amt = ivEstamt;

                        var nMax_rem = nMax_amt - nTot_chul + nTot_back + nPrv_amt;

                        if (nMax_rem < nCha_amt) {
                            alert(" 출고 가능한 금액은 " + nMax_amt.toLocaleString().slice(0, -3) + " 입니다. (기출하+주문)금액이 초과됩니다.");
                            return -1;
                        }
                    }
            }
        } else {

            var nLimit = parseFloat(this.gf_Getsyscnfg('S', 18, 1));
            var vCvcod = this.ds_master.getColumn(0, "CVCOD");

            var vRtn = this.gf_SelectSql_sync("ds_temp: SELECT SUBSTR(A.SAREA, 1, 2),  NVL(B.VALIDAMT, 0) FROM VNDMST_SUB A, VNDDAMBO B "
                + " WHERE A.CVCOD = '" + vCvcod + "' AND A.CVCOD = B.CVCOD(+) AND B.SEQ(+) = 1 ", "SELECT_VNDMST_SUB", "ff_Callback_sync", 0);
            if (vi_ErrorCode < 0) return false;

            var nAmt = parseFloat(vRtn[2]);
            if (vRtn[1] == "01")
                nLimit = 99999999;
            else
                if (nAmt > 0)
                    nLimit = nAmt;

            var nTot_chul = this.ff_Danpum_Limit(vCvcod);
            var nRem_amt = nLimit - nTot_chul;

            var nOld_amt, nNew_amt, nCha_amt = 0;

            for (var i = 0; i < this.ds_detail.rowcount; i++) {
                nOld_amt = this.ds_detail.getColumn(i, "OLD_ORDER_AMT");
                nNew_amt = this.ds_detail.getColumn(i, "ORDER_AMT");

                //2018.07.27 홍성표 추가 nOld_amt 값이 들어 오지 않음.
                if (nOld_amt == null) {
                    nOld_amt = 0;
                }

                if (this.ds_detail.getRowType(i) == Dataset.ROWTYPE_INSERT ||
                    this.ds_detail.getRowType(i) == Dataset.ROWTYPE_UPDATE) {
                    nCha_amt = nCha_amt + nNew_amt - nOld_amt;
                }
                else
                    if (this.ds_detail.getRowType(i) == Dataset.ROWTYPE_DELETE) {
                        nCha_amt = nCha_amt - nOld_amt;
                    }

                if (nCha_amt > nRem_amt) {
                    alert(" 출고 가능한 금액은 " + nRem_amt.toLocaleString().slice(0, -3) + " 입니다. 주문금액이 초과됩니다..");
                    return -1;
                }
            }
        }

        if (ivChk == '1') {
            var vOrdate = this.ds_master.getColumn(0, "ORDER_DATE");
            vJunpyoseq = this.gf_get_junpyo(vOrdate, "S0");

            if (vJunpyoseq == null) {
                alert("주문 번호가 채번되지 않았습니다");
                return -1;
            }
            vJpno = vOrdate + vJunpyoseq;   //// 전표번호

            this.ds_trans.setColumn(0, "ORDER_NO", vJpno);
        }
        else if (ivChk == '2') {
            vJpno = this.ds_master.getColumn(0, "ORDER_NO").substr(0, 12);
            var vReturn = this.gf_SelectSql_sync("ds_temp: Select Nvl(To_number(Max(substr(order_no, 13, 3))),0) From Sorder Where Order_no like '" + vJpno + "'||'%' ", "SELECT_Sorder", "ff_Callback_sync", 0);
            if (vi_ErrorCode < 0) return false;
            nSeq = parseInt(vReturn[1]);
        }

        if (fvs_mob_gbn == "Y" && fvs_mob_cancel != "Y") {   // 모바일 주문 
            for (var imb = 0; imb < this.ds_detail.rowcount; imb++) {
                if (NXCore.isEmpty(this.ds_detail.getColumn(imb, "ORD_OK_DATE")) || this.ds_detail.getColumn(imb, "ORD_OK_DATE") == "") {
                    alert("모바일 주문은 접수처리 후 저장이 가능합니다.");
                    return -1;
                }
            }
        }

        var vSusts_sys = this.gf_Getsyscnfg('S', 1, 10);
        var vGwsys = this.gf_Getsyscnfg('W', 2, 6);

        // Detail저장
        for (i = 0; i < this.ds_detail.rowcount; i++) {
            var vSts = this.ds_detail.getRowType(i);

            if (vSts == Dataset.ROWTYPE_INSERT) {
                nSeq = nSeq + 1;

                this.ds_detail.setColumn(i, "ORDER_NO", vJpno + this.gf_NumToStr(nSeq, 3));
                this.ds_detail.setColumn(i, "CRT_USER", application.gvs_userid);

                // 그룹웨어 연동안하고 환경설징이 자동승인이면 자동승인처리
                if (vSusts_sys == 'Y' && vGwsys == 'N') {
                    this.ds_detail.setColumn(i, "SUJU_STS", '2');
                }

                //              if (vGwsys == 'N')
                //              {
                //                  this.ds_detail.setColumn( i, "GWGBN",        'N');
                //              }

                this.ff_Detail_Set(i);

            }
            else if (vSts == Dataset.ROWTYPE_NORMAL || vSts == Dataset.ROWTYPE_UPDATE) {

                // 그룹웨어 연동안하고 환경설징이 자동승인이면 자동승인처리
                if (vSusts_sys == 'Y' && vGwsys == 'N') {
                    this.ds_detail.setColumn(i, "SUJU_STS", '2');
                }
                //              if (vGwsys == 'N')
                //              {
                //                  this.ds_detail.setColumn( i, "GWGBN",        'N');
                //              }

                this.ds_detail.setColumn(i, "UPD_USER", application.gvs_userid);

                this.ff_Detail_Set(i);

            }
            this.ds_detail.setColumn(i, "ESTNO", this.ds_master.getColumn(0, "ESTNO"));
            this.ds_detail.setColumn(i, "EMP_ID", this.ds_master.getColumn(0, "EMP_ID"));
            this.ds_detail.setColumn(i, "JI_EMPNO", this.ds_master.getColumn(0, "JI_EMPNO"));
            this.ds_detail.setColumn(i, "ORDER_MEMO", this.ds_master.getColumn(0, "ORDER_MEMO"));
            this.ds_detail.setColumn(i, "ORDER_DATE", this.ds_master.getColumn(0, "ORDER_DATE"));
            this.ds_detail.setColumn(i, "CUST_NAPGI", this.ds_master.getColumn(0, "ORDER_DATE"));
            this.ds_detail.setColumn(i, "GWGBN", this.ds_master.getColumn(0, "GWGBN"));
        }

        if (fvs_pswd_chk == "OK") {  // 폐업 거래처 암호 확인 
            vRtn = this.gf_SelectSql_sync("ds_temp: SELECT L_PASSWORD FROM LOGIN_T WHERE L_USERID = '" + application.gvs_userid + "' ", "SELECT_TEMP", "ff_Callback_sync", 0);
            if (vi_ErrorCode < 0) return false;

            var vs_sql = "INSERT INTO SORDER_PEUP(ORDER_NO, CVCOD, PSWD, CRT_USER)  "
                + " VALUES('" + vJpno + "' "
                + "      , '" + this.ds_master.getColumn(0, "CVCOD") + "' "
                + "      , '" + this.ds_temp.getColumn(0, "L_PASSWORD") + "' "
                + "      , '" + application.gvs_userid + "') ";

            this.gf_UpdateSql_sync(vs_sql, "UPDATE_TEMP", "ff_Callback_sync", 0);
        }

        // pdh *conv* AddUpdate(this.ds_trans);
        // pdh *conv* AddUpdate(this.ds_detail);
        this.ff_Tran_sync("SAVE_TRANS");
        this.ff_Tran_sync("SAVE_DETAIL");

        this.gf_Procedure_sync("PKG_SALE_013", vJpno, "PROC_PKG_SALE_013", "ff_Callback_sync", 0);

        if (vi_ErrorCode < 0) {
            this.gf_UpdateSql_sync("Delete from sorder_trans  Where order_no Like '" + vJpno + "'||'%' ", "Delete_sorder_trans", "ff_Callback_sync", 0);

            this.gf_UpdateSql_sync("Delete from sorder    Where order_no Like '" + vJpno + "'||'%' ", "Delete_sorder", "ff_Callback_sync", 0);
            return;
        }

        /*var vSql = "select hold_no from holdstock where order_no = '"+vJpno+"' ";
        var vResult = this.gf_SelectSql_sync("ds_temp:" + vSql , "SELECT_reffpf_5A", "ff_Callback_sync",0); 
        alert(vResult); 
        if(NXCore.isEmpty(vResult) || vResult == '')
        {
            this.gf_UpdateSql_sync("Delete from sorder_trans  Where order_no Like '"+ vJpno +"'||'%' ", "Delete_sorder_trans", "ff_Callback_sync",0);
        	
            this.gf_UpdateSql_sync("Delete from sorder    Where order_no Like '"+ vJpno +"'||'%' ", "Delete_sorder", "ff_Callback_sync",0);
        }*/

        /*if(!NXCore.isEmpty(vs_rtn) && vs_rtn != '')
        {
            this.ff_Tran_sync("SAVE_TRANS");
            this.ff_Tran_sync("SAVE_DETAIL"); 
        }*/

        // 한도초과 여부 CHECK
        /*vEstno = this.ds_master.getColumn(0, "ESTNO");
       
        if (!NXCore.isEmpty(vEstno))
        {
            var vSql = "Select * from table ( pkg_sale_017.pkg_sale_017_hando( '"+vEstno+"' ) ) ";
            var vResult = this.gf_SelectSql_sync("ds_temp:" + vSql , "SELECT_reffpf_5A", "ff_Callback_sync",0); 

            // 패키지 기준 출하로 check ( 품목분류별로 체크 안함 )
//          if ( (parseFloat(vResult[2]) - (parseFloat(vResult[9])  + parseFloat(vResult[10]) - parseFloat(vResult[11])) < 0) ||
//               (parseFloat(vResult[3]) - (parseFloat(vResult[15]) + parseFloat(vResult[16]) - parseFloat(vResult[17])) < 0) ||
//               (parseFloat(vResult[4]) - (parseFloat(vResult[21]) + parseFloat(vResult[22]) - parseFloat(vResult[23])) < 0) ||
//               (parseFloat(vResult[5]) - (parseFloat(vResult[27]) + parseFloat(vResult[28]) - parseFloat(vResult[29])) < 0) )
//          {
//              alert("품목별 계약한도가 초과 되었습니다\n수주는 승인됩니다.\계약내역을 확인하세요.\n품목 금액 기준으로는 한도를 초과하였습니다.");
//          }

            // 소비자가에 의한 출고가 있을수 있으므로 총한도 기준 check

            if (  (parseFloat(vResult[2])  + parseFloat(vResult[3])  + parseFloat(vResult[4])  + parseFloat(vResult[5]))  <
                  (parseFloat(vResult[9])  + parseFloat(vResult[10]) - parseFloat(vResult[11]) +
                   parseFloat(vResult[15]) + parseFloat(vResult[16]) - parseFloat(vResult[17]) +
                   parseFloat(vResult[21]) + parseFloat(vResult[22]) - parseFloat(vResult[23]) +
                   parseFloat(vResult[27]) + parseFloat(vResult[28]) - parseFloat(vResult[29]) +
                   parseFloat(vResult[33]) + parseFloat(vResult[34]) - parseFloat(vResult[35]) +
                   parseFloat(vResult[39]) + parseFloat(vResult[40]) - parseFloat(vResult[41]) +
                   parseFloat(vResult[45]) + parseFloat(vResult[46]) - parseFloat(vResult[47]) +
                   parseFloat(vResult[51]) + parseFloat(vResult[52]) - parseFloat(vResult[53]) )  )
            {

//                alert("품목별 계약한도가 초과 되었습니다\n수주는 승인됩니다.\계약내역을 확인하세요.\n보관품이 있는 경우에는 반입요청을 하세요.");
                
                alert("품목별 계약한도가 초과 되었습니다\계약내역을 확인하세요.\n보관품이 있는 경우에는 반입요청을 하세요.");
                return;
                
//              alert("전체 계약한도가 초과 되었습니다\n수주는 승인되지 않고 접수 상태로 됩니다.\계약내역을 확인하세요\n입력하신 수주는 출고요청되지 않습니다.");
//              this.gf_UpdateSql_sync("Delete from holdstock where order_no Like '"+vJpno+"'||'%' and isqty = 0", "UPDATE_reffpf_5A", "ff_Callback_sync",0);
//              this.gf_UpdateSql_sync("Update sorder Set suju_sts = '1', ord_ok_date = null where order_no Like '"+vJpno+"'||'%'  ", "UPDATE_reffpf_5A", "ff_Callback_sync",0);
//              this.ff_Tran("SAVE");

            }
        }*/

        //this.OnSms(vJpno);

        ivChk = '0';
        this.ff_Screen();

        this.btn_query_onclick();

        var vFind = this.ds_list.findRow("ORDER_NO", vJpno);
        if (vFind > 0) {
            this.ds_list.set_rowposition(vFind);
        }
    }

    return;
}


//------------------------------------------------------------------------------------------------ 
// 삭제  버튼 
//------------------------------------------------------------------------------------------------ 
this.btn_delete_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {

    /*if (fvs_mob_gbn == "Y") {   // 모바일 주문 
        alert("모바일 주문 등록 자료는 모바일에서 삭제하세요.");
        return;
    }*/

    if (this.ds_head.getColumn(0, "GUBUN") == '2') {

        if (!application.confirm("삭제하시겠습니까?"))
            return;

        var vOrdno = this.ds_master.getColumn(0, "ORDER_NO").substr(0, 12);
        var vRstchk = this.gf_SelectSql_sync("ds_temp: SELECT NVL(SUM(FUN_GET_HOLDSTOCK_PK_HOLD_QTY(A.ORDER_NO)), 0), "
            + "       NVL(SUM(DECODE(A.SUJU_STS, '7', 1, '8', 1, 0)), 0), NVL(SUM(A.INVOICE_QTY + A.OUT_QTY),0)    "
            + "  FROM SORDER A WHERE A.ORDER_NO LIKE '" + vOrdno + "'||'%'        ", "SELECT_SORDER", "ff_Callback_sync", 0);
        if (vi_ErrorCode < 0) return false;
        if (vRstchk[1] != '0' || vRstchk[2] != '0' || parseFloat(vRstchk[3]) != 0) {
            alert("수정하려는 주문은 이미 Picking또는 출고가 진행되었습니다...\n물류팀에 문의하시기 바랍니다");
            return;
        }

        var vJpno = this.ds_master.getColumn(0, "ORDER_NO").substr(0, 12);

        // 할당삭제,수주삭제
        // 할당삭제,수주삭제
        this.gf_UpdateSql_sync("Delete from holdstock     Where order_no Like '" + vJpno + "'||'%' ", "Delete_holdstock", "ff_Callback_sync", 0);
        if (vi_ErrorCode < 0) return false;
        this.gf_UpdateSql_sync("Delete from sorder_trans  Where order_no Like '" + vJpno + "'||'%' ", "Delete_sorder_trans", "ff_Callback_sync", 0);
        if (vi_ErrorCode < 0) return false;
        this.gf_UpdateSql_sync("Delete from sorder    Where order_no Like '" + vJpno + "'||'%' ", "Delete_sorder", "ff_Callback_sync", 0);
        if (vi_ErrorCode < 0) return false;

        this.btn_cancel_onclick();

        this.btn_query_onclick();
    }
    else {
        if (!application.confirm("삭제하시겠습니까?"))
            return;

        for (var i = this.ds_list.rowcount - 1; i >= 0; i--) {
            if (this.ds_list.getColumn(i, 'DEL_CHK') == '1') {
                var vs_Cvcod = this.ds_list.getColumn(i, 'CVCOD');
                var vs_Order_date = this.ds_list.getColumn(i, 'ORDER_DATE');
                var vs_Estno = this.ds_list.getColumn(i, 'ESTNO');
                var vs_Order_no = this.ds_list.getColumn(i, 'ORDER_NO');


                if (NXCore.isEmpty(vs_Estno) || vs_Estno == '') {
                    this.gf_UpdateSql_sync("Delete from sorder_wait  Where order_no like '" + vs_Order_no + "'||'%' and estno is null  ", "Delete_sorder_wait", "ff_Callback_sync", 0);
                }
                else {
                    this.gf_UpdateSql_sync("Delete from sorder_wait  Where order_no like '" + vs_Order_no + "'||'%' and estno = '" + vs_Estno + "'  ", "Delete_sorder_wait", "ff_Callback_sync", 0);
                }


                if (vi_ErrorCode < 0) return false;

                //this.ds_list.deleteRow(i);
            }
        }

        this.btn_query_onclick();
    }


}

//------------------------------------------------------------------------------
//  detail  추가 
//--------------------------------------------------------------------------------
this.Div_detail_btn_detail_add_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vDeptcd = this.ds_master.getColumn(0, "DEPOT_NO");

    if (NXCore.isEmpty(vDeptcd) || vDeptcd == '') {
        alert(" 출고창고 지정 후 작업하세요.");
        return;
    }

    var nArow = this.ds_detail.addRow();

    this.gsi_dataset_zero_set(this.ds_detail, nArow, fvs_default_detail);
    var vSugugb = this.ds_master.getColumn(0, "SUGUGB");

    // 수불구분은 수주구분에 의해 처리
    var vResult = this.gf_SelectSql_sync("ds_temp: select rfna2, rfna3 from reffpf where rfcod = '5A' and rfgub = '" + vSugugb + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
    if (vi_ErrorCode < 0) return false;
    this.ds_detail.setColumn(nArow, "OUT_GU", vResult[2]);
    this.ds_detail.setColumn(nArow, "CUST_NAPGI", vToday);
    this.ds_detail.setColumn(nArow, "MISAYU", this.ds_master.getColumn(0, "MISAYU"));

    this.gf_cursor_setting(this.gd_detail, nArow, "ITNBR");

    return;
}
//------------------------------------------------------------------------------
//  detail  삭제  
//--------------------------------------------------------------------------------
this.Div_detail_btn_detail_delete_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var ii = this.ds_detail.rowcount;
    var vRow = this.ds_detail.rowposition;
    if (vRow < 0) return;

    // 상태가 1,2이거나 배송준비 전이면 삭제가 가능하도록 함
    var vSts = this.ds_detail.getRowType(vRow);
    var vSuju_Sts = this.ds_detail.getColumn(vRow, "SUJU_STS"); // .getRowType( vRow); //  pdh , "suju_sts");

    if (NXCore.isEmpty(this.ds_detail.getColumn(vRow, "INVOICE_QTY"))) this.ds_detail.setColumn(vRow, "INVOICE_QTY", 0);
    if (NXCore.isEmpty(this.ds_detail.getColumn(vRow, "OUT_QTY"))) this.ds_detail.setColumn(vRow, "OUT_QTY", 0);
    if (NXCore.isEmpty(this.ds_detail.getColumn(vRow, "PICK_QTY"))) this.ds_detail.setColumn(vRow, "PICK_QTY", 0);

    if (this.ds_detail.getColumn(vRow, "INVOICE_QTY") != 0 ||
        this.ds_detail.getColumn(vRow, "OUT_QTY") != 0 ||
        this.ds_detail.getColumn(vRow, "PICK_QTY") != 0) {
        alert("1배송준비 이후이므로 삭제,수정하려면 물류팀에 취소요청 후 하시기 바랍니다");
        return;
    }
    if (vSuju_Sts > '7') {
        alert("배송준비 이후이므로 삭제,수정하려면 물류팀에 취소요청 후 하시기 바랍니다");
        return;
    }
    // pdh  로우 삭제후 저장로직에서 rowtype별로 계산함 추후 check할것.  
    if (this.ds_detail.getRowType(vRow) == Dataset.ROWTYPE_INSERT) {
        this.ds_detail.deleteRow(vRow);
    }
    else {
        this.ds_detail.set_updatecontrol(false);
        this.ds_detail.setRowType(vRow, Dataset.ROWTYPE_DELETE);
        this.ds_detail.set_updatecontrol(true);
    }

    this.ff_Real_calc();

    //  if (vSts != '1' && vSts != '2')
    //  {
    //      if (application.confirm("저장할까요?\n 저장을 해야 삭제가 최종 적용됩니다"))
    //      {
    //          this.btn_save_onclick();
    //      }
    //  }

}

/*----------------------------------------------------------------------------------
 * 설명      : TRANSACTION SYNC 후처리 함수
 * 작성일   : 2010.05.06
 *----------------------------------------------------------------------------------*/
this.ff_Callback_sync = function (sSvcID, ErrorCode, ErrorMsg) {
    vi_ErrorCode = ErrorCode;
    if (ErrorCode < 0) {
        NXCore.alert(sSvcID + "" + ErrorMsg);
        return;
    }


}


/*----------------------------------------------------------------------------------
 * 설명      : TRANSACTION 후처리 함수
 * 파라미터 : strSvcId - TRANSACTION ID, nErrorCode - Error Code, strErrorMsg - Error Msg
 * Return값  :
 * 작성자   : 박두현
 * 작성일   : 2010.05.06
 *----------------------------------------------------------------------------------*/
this.ff_Callback = function (sSvcID, ErrorCode, ErrorMsg) {
    this.grd_list.set_enableredraw(true);

    if (ErrorCode < 0) {
        NXCore.alert(sSvcID + "  " + ErrorMsg);
        return;
    }
    switch (sSvcID) {
        case "SELECT_LIST":
            if (this.ds_list.rowcount < 1) {
                this.gf_message_chk("110", ""); // 조회 및 출력할 자료가 없습니다.
            }
            break;

        case "SELECT_PRINT":
            if (this.ds_print.rowcount < 1) {
                this.gf_message_chk("110", ""); // 조회 및 출력할 자료가 없습니다.
            }

            this.printview();

            break;


    }
}
//------------------------------------------------------------------------------------------------ 
// 트란잭션 call 
//------------------------------------------------------------------------------------------------ 
this.ff_Tran = function (strSvcId) {
    this.grd_list.set_enableredraw(false);
    switch (strSvcId) {
        // 주의 ds_master 이 데이타셋의 컬럼정보를 참조 하지마시고 sql의 컬럼정보를 이용하세요. 
        case "SELECT_LIST":   //
            var vs_Gub = this.ds_head.getColumn(0, "GUBUN");
            if (vs_Gub == '2') {
                v_SvcAct = "si/send/si_send_order_neo_e_q_1q.jsp?dbconn=0";
            }
            else {

                if (NXCore.isEmpty(this.ds_head.getColumn(this.ds_head.rowposition, "CVCOD"))) {
                    this.ds_head.setColumn(0, "ARG_CVCOD", '%')
                }
                else {
                    this.ds_head.setColumn(0, "ARG_CVCOD",
                        this.ds_head.getColumn(this.ds_head.rowposition, "CVCOD"));
                }

                if (NXCore.isEmpty(this.ds_head.getColumn(this.ds_head.rowposition, "CON_CVCOD"))) {
                    this.ds_head.setColumn(0, "ARG_CON_CVCOD", '%')
                }
                else {
                    this.ds_head.setColumn(0, "ARG_CON_CVCOD",
                        this.ds_head.getColumn(this.ds_head.rowposition, "CON_CVCOD"));
                }

                if (NXCore.isEmpty(this.ds_head.getColumn(this.ds_head.rowposition, "SALES_EMPNO"))) {
                    this.ds_head.setColumn(0, "ARG_SALES_EMPNO", '%')
                }
                else {
                    this.ds_head.setColumn(0, "ARG_SALES_EMPNO",
                        this.ds_head.getColumn(this.ds_head.rowposition, "SALES_EMPNO"));
                }




                v_SvcAct = "si/send/si_send_order_neo_e_q_6q.jsp?dbconn=0";
            }

            //trace(this.ds_head.saveXML());
            v_InDataset = "ds_para=ds_head";     // 반드시 기술할것
            v_OutDataset = "ds_list=output1";  // 반드시 output1으로 기술할것
            v_Argument = "";
            break;

        case "SELECT_PRINT":   //
            v_SvcAct = "si/send/si_send_order_neo_e_q_4q.jsp?dbconn=0";
            v_InDataset = "ds_para=ds_head";     // 반드시 기술할것
            v_OutDataset = "ds_print=output1";  // 반드시 output1으로 기술할것
            v_Argument = "";
            break;
    }

    this.gf_Transaction_Async(strSvcId, v_SvcAct, v_InDataset, v_OutDataset, "ff_Callback");

}

/*----------------------------------------------------------------------------------
 * 설명      : TRANSACTION SYNC 후처리 함수
 * 작성일   : 2010.05.06
 *----------------------------------------------------------------------------------*/
this.ff_Callback_pgrm_sync = function (sSvcID, ErrorCode, ErrorMsg) {

    vi_ErrorCode = ErrorCode;
    if (ErrorCode < 0) {
        NXCore.alert(sSvcID + "" + ErrorMsg);
        return;
    }

    this.grd_list.set_enableredraw(true);

    switch (sSvcID) {
        case "SELECT_MASTER_TRANS_DETAIL":
            break;
        case "SELECT_MASTER":
            this.ds_detail.clearData();
            if (this.ds_master.rowcount > 0) {
            }
            break;
        case "SELECT_HISTORY":
            /*if(this.ds_master.rowcount > 0) 
            {
           	
            }*/
            break;

        case "SAVE_EXCEL":
            alert("저장완료되었습니다.");

            this.btn_query_onclick();
            break;
        case "SELECT_PKGQTY":
            break;
    }
}
//------------------------------------------------------------------------------------------------ 
// 트란잭션 call 
//------------------------------------------------------------------------------------------------ 
this.ff_Tran_sync = function (strSvcId) {
    this.grd_list.set_enableredraw(false);
    switch (strSvcId) {
        // 		case "SELECT_MASTER" :   // 마스터 
        // 				v_SvcAct		= "si/send/si_send_order_neo_e_e_1q.jsp?dbconn=" + 0;
        // 			    v_InDataset		=  "ds_para=ds_head";     // 반드시 기술할것
        // 			    v_OutDataset	= "ds_master=output1";  // 반드시 output1으로 기술할것
        // 			    v_Argument		= "";  
        // 			 	break;
        case "SELECT_MASTER_TRANS_DETAIL":   // 마스터 

            fvs_pswd_chk = "N";  // 폐업거래처 확인

            v_SvcAct = "si/send/si_send_order_neo_e_e_1_11_2q.jsp?dbconn=0";
            v_InDataset = "ds_para=ds_head";     // 반드시 기술할것
            v_OutDataset = "ds_master=output1 ds_trans=output2 ds_detail=output3";  // 반드시 output1으로 기술할것
            v_Argument = "";
            break;
        // 		case "SELECT_PACKAGE" :   // 
        // 				v_SvcAct		= "si/send/si_send_order_neo_e_q_2q.jsp?dbconn=" + 0;
        // 			    v_InDataset		=  "ds_para=ds_head";     // 반드시 기술할것
        // 			    v_OutDataset	= "ds_package=output1";  // 반드시 output1으로 기술할것
        // 			    v_Argument		= "";  
        // 			 	break;
        // 		case "SELECT_TRANS" :   // 
        // 				v_SvcAct		= "si/send/si_send_order_neo_e_e_11q.jsp?dbconn=" + 0;
        // 			    v_InDataset		=  "ds_para=ds_head";     // 반드시 기술할것
        // 			    v_OutDataset	= "ds_trans=output1";  // 반드시 output1으로 기술할것
        // 			    v_Argument		= "";  
        // 			 	break; 
        case "SELECT_HISTORY":   // 
            //trace(this.ds_head.saveXML());
            v_SvcAct = "si/send/si_send_order_neo_e_q_3q.jsp?dbconn=0";
            v_InDataset = "ds_para=ds_head";     // 반드시 기술할것
            v_OutDataset = "ds_history=output1";  // 반드시 output1으로 기술할것
            v_Argument = "";
            break;
        case "SELECT_DETAIL":   // 디테일 

            var vs_Gub = this.ds_head.getColumn(0, "GUBUN");
            if (vs_Gub == '2') {
                v_SvcAct = "si/send/si_send_order_neo_e_e_2q.jsp?dbconn=0";
            }
            else {
                v_SvcAct = "si/send/si_send_order_neo_e_e_3q.jsp?dbconn=0";
            }
            v_InDataset = "ds_para=ds_head";     // 반드시 기술할것
            v_OutDataset = "ds_detail=output1";  // 반드시 output1으로 기술할것
            v_Argument = "";
            break;

        case "SAVE_EXCEL":
            v_SvcAct = "si/send/si_send_order_neo_e_e_3tr.jsp?dbconn=0";
            v_InDataset = "input1=ds_excel:U ";       // 반드시 input1으로 기술할것
            v_OutDataset = "";
            break;

        case "SELECT_PKGQTY":   // 품목분류별 수량 조회 
            v_SvcAct = "si/send/si_send_order_neo_e_e_6q.jsp?dbconn=0";
            v_InDataset = "ds_para=ds_head2";     // 반드시 기술할것
            v_OutDataset = "ds_pkgqty=output1";  // 반드시 output1으로 기술할것
            v_Argument = "";
            break;

        case "SAVE_TRANS":

            v_SvcAct = "si/send/si_send_order_neo_e_e_11tr.jsp?dbconn=0";
            v_InDataset = "input1=ds_trans:U";       // 반드시 input1으로 기술할것
            v_OutDataset = "";
            break;
        case "SAVE_DETAIL":   // 디테일 
            v_SvcAct = "si/send/si_send_order_neo_e_e_2tr.jsp?dbconn=0";
            v_InDataset = "input1=ds_detail:U";       // 반드시 기술할것
            v_OutDataset = "";  // 반드시 output1으로 기술할것
            v_Argument = "";
            break;
    }

    this.gf_Transaction_sync(strSvcId, v_SvcAct, v_InDataset, v_OutDataset, "ff_Callback_pgrm_sync");

}

//-------------------------------------------------------------------------------------------
// 조건값이  변경되었을경우 
//--------------------------------------------------------------------------------------------
this.ff_head_changed = function (obj: Combo, e: nexacro.ComboCloseUpEventInfo) {

    var vData = obj.value;
    var vName = obj.name;
    var vDw = this.ds_head;
    var vRow = 0;
    switch (vName) {
        case "ed_cvcod":
        case "ed_con_cvcod":
            var vCd, vNm;
            if (vName == "ed_cvcod") {
                vCd = "CVCOD";
                vNm = "CVNAS";
            }
            else {
                vCd = "CON_CVCOD";
                vNm = "CON_CVNAS";
            }

            if (vData == null || this.gsi_TrimAll(vData) == "") {
                vDw.setColumn(vRow, vNm, null);
                return;
            }

            var vOpenSale = new Array();
            vOpenSale[0] = 'VNDMST';
            vOpenSale[1] = vData;
            vOpenSale[2] = null;
            if (vName == 'ed_cvcod' || vName == 'ed_con_cvcod') {
                vOpenSale[3] = '1';
            }
            else {
                vOpenSale[3] = '2';
            }

            var vReturnSale = this.gfi_get_name_sale(vOpenSale);
            if (vReturnSale[99] == 'POPUP') {
                this.ff_co_popu_vndsale_f("popup_" + obj.name + "_head", vReturnSale);
                return;
            }

            if (this.ff_Vndwarn(vReturnSale, "ds_head", vCd, "1181") == -1) return;

            if (vReturnSale[1] == 'NOT EXISTS') {
                vDw.setColumn(vRow, vCd, null);
                vDw.setColumn(vRow, vNm, null);
                return;
            }
            else {
                vDw.setColumn(vRow, vCd, vReturnSale[1]);
                if (vNm == "CVNAS")
                    vDw.setColumn(vRow, vNm, vReturnSale[2]);
                else
                    vDw.setColumn(vRow, vNm, vReturnSale[2]);
            }

            break;

        case "ed_sales_empno":
            if (NXCore.isEmpty(vData)) {
                this.ds_head.setColumn(0, "SALES_EMPNO", "");
                this.ds_head.setColumn(0, "SALES_EMPNAME", "");
                return;
            }
            this.ff_co_popu_sawon_sale_f("popup_ed_sales_empno_head", '' + '|' + '' + '|' + vData);
            break;
        case "ed_ji_empno":
            if (NXCore.isEmpty(vData)) {
                this.ds_head.setColumn(0, "JI_EMPNO", "");
                this.ds_head.setColumn(0, "JI_EMPNAME", "");
                return;
            }
            this.ff_co_popu_sawon_sale_f("popup_ed_ji_empno_head", '' + '|' + '' + '|' + vData);
            break;

        case "rdo_gubun":
            this.ds_detail.clearData();

            if (vData == '1') {
                //this.gd_detail.set_visible(false);				

                /*this.grd_list.set_left("2");
                this.grd_list.set_top("60");
                this.grd_list.set_width("99.69%");
                this.grd_list.set_bottom("0%");*/

                this.grd_list.setFormat("LIST_1");
                this.gd_detail.setFormat("DETAIL_1");

                this.gf_mdi_btn_disable("save,cancel, excel_up");
                this.gf_mdi_btn_enable("delete, query,excel_chg");

                this.Div_head.btn_order.set_visible(true);
            }
            else {
                //this.gd_detail.set_visible(true);		

                /*this.gd_detail.set_left("2");
                this.gd_detail.set_top("67.00%");
                this.gd_detail.set_width("99.69%");
                this.gd_detail.set_bottom("0.39%");*/

                this.grd_list.set_left("2");
                this.grd_list.set_top("60");
                this.grd_list.set_width("99.69%");
                this.grd_list.set_bottom("34.00%");

                this.grd_list.setFormat("LIST_2");
                this.gd_detail.setFormat("DETAIL_2");

                this.gf_mdi_btn_disable("delete,save,cancel, excel_up");
                this.gf_mdi_btn_enable("query,excel_chg");

                this.Div_head.btn_order.set_visible(false);
            }

            this.gf_combo_grd_sync(this.gd_detail, "DANGBN", "1^계약단가@2^패키지@3^소비자가@4^사용자", "", 0);
            this.gf_combo_grd_sync(this.gd_detail, "AMTGU", "Y^유상@N^견본", "", 0);
            this.gf_combo_grd_sync(this.gd_detail, "SUJU_STS", "co_dddw_reffpf_f_51", "", 0);
            this.gf_combo_grd_sync(this.gd_detail, "PART_GBN", "Y^예@N^아니오", "", 0);
            this.gf_combo_grd_sync(this.gd_detail, "OUT_GU", "co_dddw_iomatrix_all", "", 0);

            this.gf_combo_grd_sync(this.grd_list, "ESTSTS", "co_dddw_reffpf_f_5e", "", 0);		//계약상태


            this.btn_query_onclick();

            break;
    }

}

//-------------------------------------------------------------------------------------
// 해드의  우측 마우스 클릭
//-------------------------------------------------------------------------------------
this.Div_head_onrbuttondown = function (obj: Edit, e: nexacro.MouseEventInfo) {
    var vData = obj.value;
    switch (obj.name) {
        case "ed_cvcod":
            var vOpenParam = new Array();
            vOpenParam[0] = null;
            vOpenParam[1] = vData;
            vOpenParam[3] = null;
            vOpenParam[4] = null;

            //vOpenParam[5] = vData;
            this.ff_co_popu_vndsale_f("popup_ed_cvcod_head", vOpenParam);
            break;
        case "ed_con_cvcod":
            var vOpenParam = new Array();
            vOpenParam[0] = null;
            vOpenParam[1] = vData;
            vOpenParam[3] = null;
            vOpenParam[4] = null;
            //vOpenParam[5] = vData;
            this.ff_co_popu_vndsale_f("popup_ed_con_cvcod_head", vOpenParam);
            break;
        case "ed_sales_empno":
            this.ff_co_popu_sawon_sale_f("popup_ed_sales_empno_head", '' + '|' + '' + '|' + vData);
            break;
        case "ed_ji_empno":
            this.ff_co_popu_sawon_sale_f("popup_ed_ji_empno_head", '' + '|' + '' + '|' + vData);
            break;
    }

}

//-------------------------------------------------------------------------------
//  DS_MASTER 값이 변경 되었을경우 
//-------------------------------------------------------------------------------
this.ds_master_oncolumnchanged = function (obj: Dataset, e: nexacro.DSColChangeEventInfo) {

    var vData = e.newvalue;
    var vName = e.columnid;
    var vDw = obj;
    var vRow = this.ds_master.rowposition;
    switch (vName) {
        case "ORDER_DATE":
            if (NXCore.isEmpty(vData)) {
                return;
            }

            if (!this.gf_datecheck(vData)) {
                alert("일자를 정확히 입력하세요!!");
                this.Div_content.cal_order_date.setFocus();
                return;
            }

            if (vClosedt >= vData) {
                alert(" 주문일자가 영업마감일 이전 날짜입니다. 주문할 수 없습니다.");
                this.Div_content.cal_order_date.setFocus();
                return;
            }

            var vSql, vRtn;
            var vDepot = vDw.getColumn(vRow, "DEPOT_NO");
            var vSaup = vDw.getColumn(vRow, "SAUPJ");

            vSql = "SELECT max(JPDAT) FROM JUNPYO_CLOSING_DEPOT WHERE JPGU = 'C0' "
                + "   AND SAUPJ = '" + vSaup + "' AND DEPOT_NO = '" + vDepot + "'";

            this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_JUNPYO_CLOSING_DEPOT", "ff_Callback_sync", 0);
            if (vi_ErrorCode < 0) return false;
            if (this.ds_temp.getColumn(0, 0).substr(0, 6) >= vData.substr(0, 6)) {
                alert(" 수불마감된 일자입니다. 주문 접수 불가합니다.");
                this.Div_content.cal_order_date.setFocus();
                return;
            }

            break;

        case "JI_EMPNO":
            if (NXCore.isEmpty(vData)) {
                this.Div_content.ed_ji_empname.set_value("");
                this.Div_content.ed_ji_empno.setFocus();
                return;
            }
            this.ff_co_popu_sawon_sale_f("popup_edt_ji_Empno_master", '' + '|' + '' + '|' + vData);
            break;
        case "EMP_ID":
            if (NXCore.isEmpty(vData)) {
                this.Div_content.ed_sale_empname.set_value("");
                this.Div_content.ed_emp_id.setFocus();
                return;
            }
            this.ff_co_popu_sawon_sale_f("popup_edt_Empno_master", '' + '|' + '' + '|' + vData);
            break;

        case "CVCOD":
        case "OWNAM":

            if (NXCore.isEmpty(vData)) {
                this.ff_Package_Reset('NONE', '%');
                this.ff_Pkgchk();

                vDw.setColumn(vRow, "CVCOD", null);
                vDw.setColumn(vRow, "CVNAS", null);
                vDw.setColumn(vRow, "OWNAM", null);
                vDw.setColumn(vRow, "ESTNO", null);
                this.ds_package.clearData();
                this.ds_package.insertRow(0);
                this.gsi_dataset_zero_set(this.ds_package, 0, "GUBUN^3");
                return;
            }



            var vOpenSale = new Array();
            vOpenSale[0] = 'VNDMST';
            vOpenSale[1] = vData;
            vOpenSale[2] = null;
            if (vName == 'CVCOD') {
                vOpenSale[3] = '1';
            }
            else {
                vOpenSale[3] = '2';
            }

            var vReturnSale = this.gfi_get_name_sale(vOpenSale);
            if (vReturnSale[99] == 'POPUP') {
                this.ff_co_popu_vndsale_f("popup_ed_CVCOD_master", vReturnSale);
                return;
            }

            var vRtn = this.gf_SelectSql_sync("ds_temp: select cvstatus from vndmst where cvcod = '" + vReturnSale[1] + "'  ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

            if (vRtn[1] == '1') {
                alert("사용중지된 거래처이므로 주문접수 불가합니다.");
                vDw.setColumn(vRow, "CVCOD", '');
                vDw.setColumn(vRow, "OWNAM", '');
                return;
            }

            if (this.ff_Vndwarn(vReturnSale, "ds_master", "CVCOD", "1351") == -1) return;

            if (vReturnSale[1] == 'NOT EXISTS') {
                this.ff_Package_Reset('NONE', '%');
                this.ff_Pkgchk();

                alert("거래처가 없거나 지금 현재 거래중인 고객이 아닙니다.");
                vDw.setColumn(vRow, "CVCOD", null);
                vDw.setColumn(vRow, "CVNAS", null);
                vDw.setColumn(vRow, "OWNAM", null);
                vDw.setColumn(vRow, "ESTNO", null);

                this.ds_package.clearData();
                this.ds_package.insertRow(0);
                // pdh *conv* vDw.SetActionCode(1);
                // pdh *conv* vDw.SelectText ( 1, 0 );
            }
            else {
                vRgn_yn = 'N';
                var vRtn = this.gf_SelectSql_sync("ds_temp: select fun_get_reg_ratio('" + vData + "', '" + vRgn_Stdate + "', '" + vRgn_Eddate + "') from dual ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

                if ((parseFloat(vRtn[1]) < nRgn_Ratio) && (vReturnSale[1] != '69196')) {
                    vRgn_yn = 'N';
                    alert(" 해당 거래처는 동종골 회수율이 미달되어 동종골 출고 불가합니다. (" + parseFloat(vRtn[1]) + "%)");
                }
                else {
                    vRgn_yn = 'Y';
                }

                // 병원도 Default로 같이 Setting
                var vCon_cvcod = this.ds_master.getColumn(0, "CON_CVCOD");

                if (vCon_cvcod == null || this.gsi_TrimAll(vCon_cvcod) == '') {
                    vDw.setColumn(vRow, "CON_CVCOD", vReturnSale[1]);
                    vDw.setColumn(vRow, "CON_CVNAS", vReturnSale[2]);
                    vDw.setColumn(vRow, "CON_OWNAM", vReturnSale[3]);
                    vDw.setColumn(vRow, "SAREA", vReturnSale[6]);
                    vDw.setColumn(vRow, "EMP_ID", vReturnSale[7]);
                    vDw.setColumn(vRow, "SALE_EMPNAME", vReturnSale[8]);

                    vDw.setColumn(vRow, "OWNAM", vReturnSale[3]);
                    vDw.setColumn(vRow, "CVNAS", vReturnSale[2]);
                    vDw.setColumn(vRow, "CVCOD", vReturnSale[1]);

                    this.ff_Trans_Set(vReturnSale[1], this.ds_trans.getColumn(0, "TRANS_GU"));
                }

                vDw.setColumn(vRow, "CVCOD", vReturnSale[1]);
                vDw.setColumn(vRow, "CVNAS", vReturnSale[2]);
                vDw.setColumn(vRow, "OWNAM", vReturnSale[3]);

                // pdh *conv* vDw.SetActionCode(1);
                // pdh *conv* vDw.SelectText ( 1, 0 );

                this.ff_Package_Reset(vReturnSale[1], '%');
                this.ff_Pkgchk();
                this.ff_History(vReturnSale[1]);
                //this.ff_Danga_Full();
            }

            break;
        case "CON_CVCOD":
        case "CON_OWNAM":

            if (NXCore.isEmpty(vData)) {
                vDw.setColumn(vRow, "CON_CVCOD", null);
                vDw.setColumn(vRow, "CON_CVNAS", null);
                vDw.setColumn(vRow, "CON_OWNAM", null);
                return;
            }

            var vOpenSale = new Array();
            vOpenSale[0] = 'VNDMST';
            vOpenSale[1] = vData;
            vOpenSale[2] = null;
            if (vName == 'con_cvcod') {
                vOpenSale[3] = '1';
            }
            else {
                vOpenSale[3] = '2';
            }

            var vReturnSale = this.gfi_get_name_sale(vOpenSale);
            if (vReturnSale[99] == 'POPUP') {
                this.ff_co_popu_vndsale_f("popup_ed_CON_CVCOD_master", vReturnSale);
                return;
            }
            if (this.ff_Vndwarn(vReturnSale, "ds_master", "CON_CVCOD", "1444") == -1) return;

            if (vReturnSale[1] == 'NOT EXISTS') {
                alert("거래처가 없거나 지금 현재 거래중인 고객이 아닙니다.");

                vDw.setColumn(vRow, "CON_CVCOD", null);
                vDw.setColumn(vRow, "CON_CVNAS", null);
                vDw.setColumn(vRow, "CON_OWNAM", null);
                // pdh *conv* vDw.SetActionCode(1);
                // pdh *conv* vDw.SelectText ( 1, 0 );
                return;
            }
            else {
                vDw.setColumn(vRow, "CON_CVCOD", vReturnSale[1]);
                vDw.setColumn(vRow, "CON_CVNAS", vReturnSale[2]);
                vDw.setColumn(vRow, "CON_OWNAM", vReturnSale[3]);
                vDw.setColumn(vRow, "SAREA", vReturnSale[6]);

                vDw.setColumn(vRow, "EMP_ID", vReturnSale[7]);
                vDw.setColumn(vRow, "SALE_EMPNAME", vReturnSale[8]);

                this.ff_Trans_Set(vReturnSale[1], this.ds_trans.getColumn(0, "TRANS_GU"));

                // pdh *conv* vDw.SetActionCode(1);
                // pdh *conv* vDw.SelectText ( 1, 0 );
                return;
            }

            break;
        case "SUGUGB":
            var vResult = this.gf_SelectSql_sync("ds_temp: select rfna2, rfna3 from reffpf where rfcod = '5A' and rfgub = '" + vData + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
            if (vi_ErrorCode < 0) return false;
            // 수불구분 변경
            for (i = 0; i < this.ds_detail.rowcount; i++) {
                this.ds_detail.setColumn(i, "OUT_GU", tvResult[2]);
            }

            break;
        case "MISAYU":  // 전체를 소비자가로 Setting ( 계약번호 없이 일반 출고로 지정 )
            if (vData == 'Y') {
                if (!application.confirm("소비자가를 선택하시면 계약번호 없이 일반 소비자가로 출고됩니다..\n계속 진행하시겠습니까?")) {
                    vDw.setColumn(vRow, vName, 'N');
                    // pdh *conv* vDw.SetActionCode(1);
                    // pdh *conv* vDw.SelectText(1, 0);
                }

                this.ff_Package_Reset(vDw.getColumn(vRow, "CVCOD"), 'Sobi');
                this.ff_Pkgchk();

                this.ds_master.setColumn(0, "ESTNO", null);

                for (i = 0; i < this.ds_detail.rowcount; i++) {
                    this.ds_detail.setColumn(i, "ESTNO", null);
                }

            }
            else {
                this.ff_Package_Reset(vDw.getColumn(vRow, "CVCOD"), '%');
                this.ff_Pkgchk();
            }



            if (this.ds_detail.rowcount > 0) {
                if (vData == 'Y') {
                    alert("현재 편집중인 품목에 대해 소비자가로 일괄 재계산을 실시합니다");
                    for (i = 0; i < this.ds_detail.rowcount; i++) {
                        this.ds_detail.setColumn(i, "DANGBN", '3');
                        this.ds_detail.setColumn(i, "MISAYU", 'Y');
                        this.ds_detail.setColumn(i, "ESTNO", null);
                        this.ff_Danga(this.ds_detail.getColumn(i, "ITNBR"), i, this.ds_detail.getColumn(i, "TUNCU"), 'Sobi');
                    }

                }
                else {
                    var vName, vGubun;
                    vGubun = this.ds_package.getColumn(0, "GUBUN");
                    switch (vGubun) {
                        case '1':
                            vName = "납품계약단가";
                            break;
                        case '2':
                            vName = "패키지 계약단가";
                            break;
                        case '3':
                            vName = "소비자가";
                            break;
                        default:
                            vName = "사용자 조정가";
                            break;
                    }

                    alert("현재 편집중인 품목에 대해 " + vName + "로 일괄 재계산을 실시합니다");
                    for (i = 0; i < this.ds_detail.rowcount; i++) {
                        this.ds_detail.setColumn(i, "DANGBN", vGubun);
                        this.ds_detail.setColumn(i, "MISAYU", 'Y');
                        this.ff_Danga(this.ds_detail.getColumn(i, "ITNBR"), i, this.ds_detail.getColumn(i, "TUNCU"), 'Auto');
                    }
                }
            }
            break;
        case "DEPOT_NO":
            trace(vData)
            var vRdept = this.gf_SelectSql_sync("ds_temp: SELECT CVSTATUS FROM VNDMST WHERE CVCOD = '" + vData + "' ", "SELECT_VNDMST", "ff_Callback_sync", 0);
            if (vi_ErrorCode < 0) return false;
            if (vRdept[1] != '0') {
                alert("사용중인 창고가 아닙니다..\n물류팀에 확인 바랍니다");
                vDw.setColumn(vRow, vName, '');
                return;
            }
            break;
        default:
            break;
    }

}


//-------------------------------------------------------------------------------------------
// ds_trans 의 컬럼이 변경되었을 경우 
//------------------------------------------------------------------------------------------- 
this.ds_trans_oncolumnchanged = function (obj: Dataset, e: nexacro.DSColChangeEventInfo) {
    var vData = e.newvalue;
    var vName = e.columnid;
    var vDw = obj;
    var vRow = this.ds_trans.rowposition;
    switch (vName) {
        case "TRANS_CVCOD":
        case "TRANS_SAREA":
            if (NXCore.isEmpty(vData)) {
                vDw.setColumn(vRow, "TRANS_CVCOD", null);
                vDw.setColumn(vRow, "CVNAS", null);
                vDw.setColumn(vRow, "OWNAM", null);
                vDw.setColumn(vRow, "TRANS_HUMAN", null);
                vDw.setColumn(vRow, "TRANS_TELNO", null);
                vDw.setColumn(vRow, "TRANS_ADDR", null);
                vDw.setColumn(vRow, "TRANS_ADDR1", null);
                return;
            }

            var vOpenSale = new Array();
            vOpenSale[0] = 'VNDMST';
            vOpenSale[1] = vData;
            vOpenSale[2] = null;
            vOpenSale[3] = '1';

            var vReturnSale = this.gfi_get_name_sale(vOpenSale);
            if (vReturnSale[99] == 'POPUP') {
                this.ff_co_popu_vndsale_f("popup_ed_TRANS_CVCOD_trasn", vReturnSale);
                return;
            }

            if (this.ff_Vndwarn(vReturnSale, "ds_trans", "TRANS_CVCOD", "1612") == -1) return;

            if (vReturnSale[1] == 'NOT EXISTS') {
                alert("거래처가 없거나 지금 현재 거래중인 고객이 아닙니다.");

                vDw.setColumn(vRow, "TRANS_CVCOD", null);
                vDw.setColumn(vRow, "CVNAS", null);
                vDw.setColumn(vRow, "OWNAM", null);
                vDw.setColumn(vRow, "TRANS_HUMAN", null);
                vDw.setColumn(vRow, "TRANS_TELNO", null);
                vDw.setColumn(vRow, "TRANS_ADDR", null);
                vDw.setColumn(vRow, "TRANS_ADDR1", null);
                // pdh *conv* vDw.SetActionCode(1);
                // pdh *conv* vDw.SelectText ( 1, 0 );
                return;
            }

            if (vName == "TRANS_CVCOD") {
                //var vSql = "Select cvnas2, ownam, cvpln, decode(Nvl(telno1, ''), '', null, telno1||'-'||telno2||'-'||telno3), "

                var vSql = "Select cvnas2, ownam, cvpln, decode(Nvl(telno1, '.'), '.', tr_telno, telno1||'-'||telno2||'-'||telno3), "
                    + "       addr1||nvl(addr2, ' '), cvstatus, posno          "
                    + "  From vndmst where cvcod = '" + vReturnSale[1] + "' ";
            } else {
                var vSql = "Select a.cvnas2, a.ownam, a.cvpln, decode(Nvl(b.telno, ''), '', null, b.telno), "
                    + "       b.addr1||nvl(b.addr2, ' '), a.cvstatus, b.posno          "
                    + "  From vndmst a, sarea_addr b, sarea c where a.cvcod = '" + vReturnSale[1] + "' and a.cvcod = c.deptcode and c.sarea = b.cvcod";
            }

            var vResult = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_reffpf_5A", "ff_Callback_sync", 0);
            if (vi_ErrorCode < 0) return false;

            //alert(vReturnSale[1]);
            vDw.setColumn(vRow, "TRANS_CVCOD", vReturnSale[1]);
            vDw.setColumn(vRow, "CVNAS", vResult[1]);
            vDw.setColumn(vRow, "OWNAM", vResult[2]);
            vDw.setColumn(vRow, "TRANS_HUMAN", vResult[3]);
            vDw.setColumn(vRow, "TRANS_TELNO", vResult[4]);
            vDw.setColumn(vRow, "TRANS_ADDR", vResult[5]);
            vDw.setColumn(vRow, "POSNO", vResult[7]);
            vDw.setColumn(vRow, "TRANS_ADDR1", null);

            break;

        case "TRANS_GU":
            var vGbn = vData;

            this.ff_Trans_Set(this.ds_master.getColumn(0, "CON_CVCOD"), vData);

            vDw.setColumn(vRow, vName, vGbn);

            break;
        case "POSNO":
            this.ff_hr_co_popu_addr_f("popup_ed_POSNO_trasn", vData);
            break;

        default:
            break;

    }
}
//-------------------------------------------------------------------------------------------
// detail 의 컬럼이 변경되었을 경우 
//------------------------------------------------------------------------------------------- 
this.ds_detail_oncolumnchanged = function (obj: Dataset, e: nexacro.DSColChangeEventInfo) {
    var vData = e.newvalue;
    var vName = e.columnid;
    var vDw = obj;
    var vRow = this.ds_detail.rowposition;

    switch (vName) {
        case "AMTGU":
            if (vData == 'Y') {
                vDw.setColumn(vRow, "OUT_GU", 'O02');
                this.ff_Danga(vDw.getColumn(vRow, "ITNBR"), vRow, 'KRW', 'Auto');
            }
            else {

                vDw.setColumn(vRow, "OUT_GU", 'O18');
                vDw.setColumn(vRow, "ORDER_PRC", 0);
                vDw.setColumn(vRow, "ORDER_AMT", 0);
                vDw.setColumn(vRow, "UNPRC", 0);
                vDw.setColumn(vRow, "VATAMT", 0);
                vDw.setColumn(vRow, "DANAMT", 0);

                this.ff_Real_calc();
            }
            break;

        case "ITNBR":
        case "ITDSC":
            if (NXCore.isEmpty(vData)) {

                vDw.setColumn(vRow, "ITDSC", null);
                vDw.setColumn(vRow, "PRODNM", null);
                vDw.setColumn(vRow, "ISPEC", null);
                vDw.setColumn(vRow, "ORDER_PRC", 0);
                vDw.setColumn(vRow, "ORDER_AMT", 0);
                vDw.setColumn(vRow, "UNPRC", 0);
                vDw.setColumn(vRow, "VATAMT", 0);
                vDw.setColumn(vRow, "DANAMT", 0);

                this.ff_Real_calc();
                return;
            }

            var vOpenSale = new Array();
            vOpenSale[0] = 'ITEMAS';

            vOpenSale[1] = vData;
            vOpenSale[2] = '1,7';  // 품목구분
            vOpenSale[3] = 'Y';    // Y이면 검색시 POPUP을 자동으로 띄우고 N이면 POPUP을 안띄움
            vOpenSale[4] = 'M';    // 선택기준 M:Multi, S:Single
            vOpenSale[5] = '';

            var vReturnSale = this.gfi_get_name_sale(vOpenSale);
            if (vReturnSale[99] == 'POPUP') {
                this.ff_co_popu_itemas_f_4("co_popu_itnbr_detail", vReturnSale);
                return;
            }


            if (vReturnSale[1] == 'NOT EXISTS' || vReturnSale[5] != '0') {
                alert("품목이 없거나 현재사용중이지 않은 품목입니다.");

                vDw.setColumn(vRow, "ITNBR", null);
                vDw.setColumn(vRow, "PRODNM", null);
                vDw.setColumn(vRow, "ITDSC", null);
                vDw.setColumn(vRow, "ISPEC", null);
                vDw.setColumn(vRow, "ORDER_PRC", 0);
                vDw.setColumn(vRow, "ORDER_AMT", 0);
                vDw.setColumn(vRow, "UNPRC", 0);
                vDw.setColumn(vRow, "VATAMT", 0);
                vDw.setColumn(vRow, "DANAMT", 0);

                this.ff_Real_calc();
                return;
            }

            if (vReturnSale[6] == '1' && vReturnSale[11] == '9999001') {
                alert("패키지 판매품목은 팩 판매등록에서만 사용가능합니다..");

                vDw.setColumn(vRow, "ITNBR", null);
                vDw.setColumn(vRow, "PRODNM", null);
                vDw.setColumn(vRow, "ITDSC", null);
                vDw.setColumn(vRow, "ISPEC", null);
                vDw.setColumn(vRow, "ORDER_PRC", 0);
                vDw.setColumn(vRow, "ORDER_AMT", 0);
                vDw.setColumn(vRow, "UNPRC", 0);
                vDw.setColumn(vRow, "VATAMT", 0);
                vDw.setColumn(vRow, "DANAMT", 0);
                this.ff_Real_calc();
                return;
            }

            if (vRgn_yn == 'N') {
                var vRtn = this.gf_SelectSql_sync("ds_temp: Select count(*) from reffpf where rfcod = '5S' and rfna1 = '" + vData + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
                var vCvcod = this.ds_master.getColumn(0, "CVCOD");

                if ((parseInt(vRtn[1]) > 0) && (vCvcod != '69196')) {
                    alert(" 동종골 회수율이 미달되어 동종골 주문 불가합니다.");

                    if (vRgn_Ctdate <= vToday) {
                        vDw.setColumn(vRow, "ITNBR", '');
                        vDw.setColumn(vRow, "PRODNM", '');
                        vDw.setColumn(vRow, "ITDSC", '');
                        vDw.setColumn(vRow, "ISPEC", '');
                        return;
                    }
                }
            }


            var vDept = this.ds_master.getColumn(0, "DEPOT_NO");
            var vStkchk = this.gf_Getsyscnfg('S', 17, 1);

            var vSql = "SELECT A.NEWITS, B.JEGO_QTY, C.BLK_YN, C.BLK_ONLY, D.ITTYP, D.ITCLS FROM ITEMAS_MRP A, STOCK B, ITEMAS_ADD_INFO C, ITEMAS D "
                + " WHERE A.ITNBR = '" + vReturnSale[1] + "' AND A.ITNBR = B.ITNBR(+) "
                + "   AND B.DEPOT_NO(+) = '" + vDept + "' AND A.ITNBR = C.ITNBR(+) AND A.ITNBR = D.ITNBR";

            var vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_reffpf_5A", "ff_Callback_sync", 0);
            if (vi_ErrorCode < 0) return false;

            if (vDept == 'ZS010' || vDept == 'ZS094') {
                var vCon_spc_gbn = this.ds_package.getColumn(0, "CON_SPC_GBN");

                ///////////////////////////////////////////////////////////////////////
                ///// 2016.07.26 GUIDE 는 제품PAC, GUIDE PAC 으로 출고 가능하다.
                ///// GUIDE PAC 으로 출고 가능한 품목을 제한한다.
                ///// GUIDE PAC 으로 FIXTURE, ABUTEMENT, NEOBUIDE 출고 가능, 그외 불가
                ///// 고 GUIDE 의 요청으로...
                ///////////////////////////////////////////////////////////////////////				

                if (vRtn[5] == '1' && vRtn[6].substr(0, 4) == '0703') {
                    if (vCon_spc_gbn != '1' && vCon_spc_gbn != 'B' && vCon_spc_gbn != '5' && vCon_spc_gbn != '11') {
                        alert(vReturnSale[1] + " 제품 PAC 혹은 GUIDE PAC 으로만 주문 가능한 품목입니다.");
                        vDw.setColumn(vRow, "ITNBR", null);
                        return;
                    }
                }

                /*				if (vCon_spc_gbn == 'B') 
                                {
                            	
                                    if (vRtn[5] != '1' || (vRtn[5] == '1' && (vRtn[6].substr(0, 4) > '0299' && vRtn[6].substr(0, 4) != '0703'))) {
                                        alert(vReturnSale[1] + " GUIDE PAC. 으로 주문 불가한 품목입니다.");
                                        vDw.setColumn( vRow, "ITNBR", null);
                                        return;
                                    }
                                }*/


                if (vRtn[1] != 'Y' || vRtn[2] < 1) {
                    var vRet = this.gf_SelectSql_sync("ds_temp: SELECT JUMAECHUL  "
                        + " FROM vndmst_stock   "
                        + " WHERE cvcod  = '" + vDept + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);


                    if (vRet[1] != '4') {
                        if (vRtn[1] == 'N') {
                            alert(vReturnSale[1] + " 주문 불가 품목입니다.");

                            vDw.setColumn(vRow, "ITNBR", null);
                            vDw.setColumn(vRow, "PRODNM", null);
                            vDw.setColumn(vRow, "ITDSC", null);
                            vDw.setColumn(vRow, "ISPEC", null);
                            vDw.setColumn(vRow, "ORDER_PRC", 0);
                            vDw.setColumn(vRow, "ORDER_AMT", 0);
                            vDw.setColumn(vRow, "UNPRC", 0);
                            vDw.setColumn(vRow, "VATAMT", 0);
                            vDw.setColumn(vRow, "DANAMT", 0);

                            this.ff_Real_calc();
                            return;
                        }
                        else
                            if (vRtn[1] == 'O') {
                                var vOrdate = this.gsi_TrimAll(this.ds_master.getColumn(0, "ORDER_DATE"));
                                var vSysdate = this.gf_today();

                                if (vOrdate <= vSysdate) {
                                    alert(vReturnSale[1] + " 제한적 주문 품목입니다.");

                                    vDw.setColumn(vRow, "ITNBR", null);
                                    vDw.setColumn(vRow, "PRODNM", null);
                                    vDw.setColumn(vRow, "ITDSC", null);
                                    vDw.setColumn(vRow, "ISPEC", null);
                                    vDw.setColumn(vRow, "ORDER_PRC", 0);
                                    vDw.setColumn(vRow, "ORDER_AMT", 0);
                                    vDw.setColumn(vRow, "UNPRC", 0);
                                    vDw.setColumn(vRow, "VATAMT", 0);
                                    vDw.setColumn(vRow, "DANAMT", 0);

                                    this.ff_Real_calc();
                                    return;
                                }
                            }

                        if (vStkchk == 'Y') {
                            alert(vReturnSale[1] + " 재고 없는 품목입니다.");

                            vDw.setColumn(vRow, "ITNBR", null);
                            vDw.setColumn(vRow, "PRODNM", null);
                            vDw.setColumn(vRow, "ITDSC", null);
                            vDw.setColumn(vRow, "ISPEC", null);
                            vDw.setColumn(vRow, "ORDER_PRC", 0);
                            vDw.setColumn(vRow, "ORDER_AMT", 0);
                            vDw.setColumn(vRow, "UNPRC", 0);
                            vDw.setColumn(vRow, "VATAMT", 0);
                            vDw.setColumn(vRow, "DANAMT", 0);

                            this.ff_Real_calc();
                            return;
                        }
                    }
                }
            }

            if (this.ds_master.getColumn(0, "ESTNO") != '' && this.ds_master.getColumn(0, "ESTNO") != null) {
                if (this.ds_package.getColumn(0, "CON_SPC_GBN") == '5') {
                    if (vRtn[3] != 'Y') {
                        vDw.setColumn(vRow, "ITNBR", null);
                        alert(vReturnSale[1] + " 블럭 계약으로 주문 불가 품목입니다.");
                        // pdh *conv* vDw.SetActionCode(1);
                        // pdh *conv* vDw.SelectText ( 1, 0 );
                        return;
                    }
                } else {
                    if (vRtn[4] == 'Y') {
                        vDw.setColumn(vRow, "ITNBR", null);
                        alert(vReturnSale[1] + " 블럭 계약만 주문 가능한 품목입니다.");
                        // pdh *conv* vDw.SetActionCode(1);
                        // pdh *conv* vDw.SelectText ( 1, 0 );
                        return;
                    }
                }
            }

            var nRow = vDw.findRow("ITNBR", vReturnSale[1]);

            if (nRow >= 0 && nRow != vRow) {
                if (!application.confirm(nRow + "행에 이미 동일한 형번이 있습니다\n입력하시겠습니까?")) {

                    vDw.setColumn(vRow, "ITNBR", null);
                    vDw.setColumn(vRow, "PRODNM", null);
                    vDw.setColumn(vRow, "ITDSC", null);
                    vDw.setColumn(vRow, "ISPEC", null);
                    vDw.setColumn(vRow, "ORDER_PRC", 0);
                    vDw.setColumn(vRow, "ORDER_AMT", 0);
                    vDw.setColumn(vRow, "UNPRC", 0);
                    vDw.setColumn(vRow, "VATAMT", 0);
                    vDw.setColumn(vRow, "DANAMT", 0);
                    this.ff_Real_calc();
                    return;
                }
            }
            vDw.setColumn(vRow, "ITNBR", vReturnSale[1]);
            vDw.setColumn(vRow, "PRODNM", vReturnSale[2]);
            vDw.setColumn(vRow, "ITDSC", vReturnSale[3]);
            vDw.setColumn(vRow, "ISPEC", vReturnSale[4]);

            // 20240611_품목제한 여부 추가 - 시작
            if (!NXCore.isEmpty(this.ds_master.getColumn(0, "ESTNO")) && this.ds_master.getColumn(0, "ESTNO") != '') {
                var vSql = "SELECT NVL(B.LIMIT_YN, 'N') AS LIMIT_YN, A.PKGNO FROM ESTIMATE_HEAD A, PKGMST B WHERE A.ESTNO = '" + this.ds_master.getColumn(0, "ESTNO") + "' AND A.PKGNO = B.PKGNO ";
                var vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_LIMIT_CHK", "ff_Callback_sync", 0);
                if (vi_ErrorCode < 0) return false;

                if (this.ds_temp.getColumn(0, "LIMIT_YN") == 'Y') {
                    var vPkgno = this.ds_temp.getColumn(0, "PKGNO");

                    var vSql = "SELECT COUNT(*) AS CNT FROM PKGDTL A WHERE A.PKGNO = '" + vPkgno + "' AND A.ITNBR = '" + vReturnSale[1] + "' ";
                    var vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_LIMIT_ITEMAS_CHK", "ff_Callback_sync", 0);
                    if (vi_ErrorCode < 0) return false;

                    if (this.ds_temp.getColumn(0, "CNT") <= 0) {
                        this.gf_message_chk("521497", "계약번호 : " + this.ds_master.getColumn(0, "ESTNO"));
                        vDw.setColumn(vRow, "ITNBR", null);
                        vDw.setColumn(vRow, "PRODNM", null);
                        vDw.setColumn(vRow, "ITDSC", null);
                        vDw.setColumn(vRow, "ISPEC", null);
                        vDw.setColumn(vRow, "ORDER_PRC", 0);
                        vDw.setColumn(vRow, "ORDER_AMT", 0);
                        vDw.setColumn(vRow, "UNPRC", 0);
                        vDw.setColumn(vRow, "VATAMT", 0);
                        vDw.setColumn(vRow, "DANAMT", 0);
                        this.ff_Real_calc();
                        return;

                    }
                }
            }
            // 20240611_품목제한 여부 추가 - 끝

            var vSql = "Select fct_gbn, ins_claim_yn From ITEMAS_ADD_INFO Where ITNBR = '" + vReturnSale[1] + "'";
            var vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_reffpf_5A", "ff_Callback_sync", 0);
            if (vi_ErrorCode < 0) return false;
            vDw.setColumn(vRow, "FACGBN", vRtn[1]);
            vDw.setColumn(vRow, "INS_CLAIM_YN", vRtn[2]);

            this.ff_Danga(vReturnSale[1], vRow, 'KRW', 'Auto');


            /*홍성표 구성품 등록 스타트
        	
            */
            var vs_cnt = this.gf_SelectSql_sync("ds_temp: Select count(*) from itemas_mrp where itnbr = '" + vReturnSale[1] + "' and containgu = 'Y'  ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

            if (vs_cnt[1] > 0) {
                this.ff_co_popu_itemaskit_f("co_popu_itnkit", vReturnSale[1]);
            }

            break;

        case "ORDER_QTY":
            if (parseFloat(vData) < vDw.getColumn(vRow, "INVOICE_QTY")) {
                alert("요청수량이 출고진행수량 보다 작을수 는 없습니다");
                var vAmt = Math.floor(vDw.getColumn(vRow, "OLD_QTY") * vDw.getColumn(vRow, "ORDER_PRC"));
                var vVat = Math.floor((vAmt * 10 / 11) * 0.1);
                var vPrc = Math.floor(vAmt - vVat);

                vDw.setColumn(vRow, "ORDER_QTY", vDw.getColumn(vRow, "OLD_QTY"));
                vDw.setColumn(vRow, "ORDER_AMT", vAmt);
                vDw.setColumn(vRow, "UNPRC", vPrc);
                vDw.setColumn(vRow, "VATAMT", vVat);

                this.ff_Real_calc();

                // pdh *conv* vDw.SetActionCode(1);
                // pdh *conv* vDw.SelectText ( 1, 0 );

                return;
            }

            // 20240216 의약품 수량별 단가 계산
            var vs_MedQty_chk = this.gf_SelectSql_sync("ds_temp: SELECT COUNT(*) AS CNT FROM MED_QTY_DANGA WHERE ITNBR = '" + this.ds_detail.getColumn(vRow, 'ITNBR') + "' AND USEYN = 'Y' AND CODAT <= '" + vToday + "' ", "SELECT_MED_QTY_DANGA_CHK", "ff_Callback_sync", 0);

            if (vs_MedQty_chk[1] != 0) {
                var vMedAmt = this.gf_Function_sync("FUN_GET_MED_QTY_DANGA", this.ds_detail.getColumn(vRow, 'ITNBR') + "|" + this.ds_detail.getColumn(vRow, 'CVCOD') + "|" + vToday + "|" + vData, "FUNCTION", "ff_Callback_sync", 0);
                this.ds_detail.setColumn(vRow, "ORDER_PRC", vMedAmt);
                this.ds_detail.setColumn(vRow, "DANAMT", vMedAmt);
            }

            var vAmt = Math.floor(parseFloat(vData) * vDw.getColumn(vRow, "ORDER_PRC"));
            var vVat = Math.floor((vAmt * 10 / 11) * 0.1);
            var vPrc = Math.floor(vAmt - vVat);

            vDw.setColumn(vRow, "ORDER_AMT", vAmt);
            vDw.setColumn(vRow, "UNPRC", vPrc);
            vDw.setColumn(vRow, "VATAMT", vVat);

            this.ff_Real_calc();

            break;

        case "ORDER_PRC":
            var vAmt = Math.floor(parseFloat(vData) * vDw.getColumn(vRow, "ORDER_QTY"));
            var vVat = Math.floor((vAmt * 10 / 11) * 0.1);
            var vPrc = Math.floor(vAmt - vVat);

            vDw.setColumn(vRow, "ORDER_AMT", vAmt);
            vDw.setColumn(vRow, "UNPRC", vPrc);
            vDw.setColumn(vRow, "VATAMT", vVat);

            this.ff_Real_calc();

            break;

        case "CUST_NAPGI":
            if (NXCore.isEmpty(vData)) {
                return;
            }

            if (!this.gf_datecheck(vData)) {
                alert("일자를 정확히 입력하세요!!");
                vDw.setColumn(vRow, vName, vToday);
                this.gf_cursor_setting(vDw, vRow, vName);
                return;
            }
            break;

        case "SOBI_CHK":
            if (vData == '1') {
                this.ff_Danga(vDw.getColumn(vRow, "ITNBR"), vRow, 'KRW', 'Sobi');
            }
            else {
                this.ff_Danga(vDw.getColumn(vRow, "ITNBR"), vRow, 'KRW', 'Auto');
            }
            break;

        default:
            break;

    }
}


//-------------------------------------------------------------------------------
// list 에서 다블  클릭 
//-------------------------------------------------------------------------------
this.grd_list_oncelldblclick = function (obj: Grid, e: nexacro.GridClickEventInfo) {
    if (e.row < 0) return;
    ivChk = 2;
    var vRow = e.row;

    if (this.ds_head.getColumn(0, "GUBUN") == '1') return;

    var vOrder_no = this.ds_list.getColumn(vRow, "ORDER_NO").substr(0, 12);
    var vGwsts = this.ds_list.getColumn(vRow, "GWSTS_CNT");
    var vSuju_sts = this.ds_list.getColumn(vRow, "SUJU_STS_CNT");
    var vCvcod = this.ds_list.getColumn(vRow, "CVCOD");
    var vEstno = this.ds_list.getColumn(vRow, "ESTNO");
    var vSuju_type = this.ds_list.getColumn(vRow, "SUJU_STS");
    this.ds_head.setColumn(0, "ARG_ORDER_NO", vOrder_no);
    this.ff_Screen();
    this.ff_Tran_sync("SELECT_MASTER_TRANS_DETAIL");

    this.ff_Package_Reset_Inquery(vCvcod, vEstno);

    this.ds_master.setColumn(0, "ESTNO", vEstno);

    this.ff_History(vCvcod);
    this.ff_LeaseSet(vEstno);


    if (this.ds_list.getColumn(this.ds_list.rowposition, "MOB_GBN") == "0") {
        this.Div_detail.btn_detail_mob_ok.set_visible(false);     // 모바일 접수 
        this.Div_detail.btn_detail_mob_cncl.set_visible(false);   // 모바일 취소 

        this.Div_detail.btn_detail_add00.set_visible(true);
        this.Div_detail.btn_detail_add.set_visible(true);
        this.Div_detail.btn_detail_delete.set_visible(true);
        this.Div_detail.btn_detail_add.set_enable(true);
        this.Div_detail.btn_detail_delete.set_enable(true);


        fvs_mob_gbn = "N";  // web 주문 
    }
    else {
        this.Div_detail.btn_detail_mob_ok.set_visible(true);     // 모바일 접수 
        this.Div_detail.btn_detail_mob_cncl.set_visible(true);   // 모바일 취소 

        this.Div_detail.btn_detail_add00.set_visible(false);
        this.Div_detail.btn_detail_add.set_visible(false);
        this.Div_detail.btn_detail_delete.set_visible(false);
        this.Div_detail.btn_detail_add.set_enable(false);
        this.Div_detail.btn_detail_delete.set_enable(false);

        fvs_mob_gbn = "Y";  // 모바일 주문 
    }

    if (this.ds_trans.rowcount == 0) {
        this.ds_trans.insertRow(0);
        this.gsi_dataset_zero_set(this.ds_trans, 0, fvs_default_trans);
        this.ds_trans.setColumn(0, "ORDER_NO", vOrder_no);
    }

    var vRtn = this.gf_SelectSql_sync("ds_temp: SELECT MAX(PICK_YMD)  FROM HOLDSTOCK WHERE ORDER_NO LIKE '" + vOrder_no + "'||'%'  ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

    if (NXCore.isEmpty(vRtn[1]) || vRtn[1] == '' || vRtn[1] == 0) {
        this.ff_protect_content(true);
    }
    else {
        this.ff_protect_content(false);

        var vRtn2 = this.gf_SelectSql_sync("ds_temp: SELECT COUNT(*)  FROM JPNOPRINT WHERE TAB_NM = 'SORDER' AND JPNO LIKE '" + vOrder_no + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

        if (vRtn2[1] == 0 || NXCore.isEmpty(vRtn2[1]) || vRtn2[1] == '') {
            this.Div_content.set_enable(true);
            this.gd_detail.set_cssclass('');
            this.gd_detail.set_readonly(false);
        }
        else {
            alert("접수이후에 출하진행된 정보가 있으므로 기본정보는 수정 할 수 없고 삭제도 안됩니다."
                + " 필요하신 경우 주문승인 처리에서 건별 취소하시기 바랍니다");
            this.gf_mdi_btn_disable("delete");

            this.Div_detail.btn_detail_add.set_enable(false);
            this.Div_detail.btn_detail_delete.set_enable(false);

            this.Div_detail.btn_detail_mob_ok.set_visible(false);     // 모바일 접수 
            this.Div_detail.btn_detail_mob_cncl.set_visible(false);   // 모바일 취소 

            this.Div_content.set_enable(false);
            this.gd_detail.set_cssclass('readonly');
            this.gd_detail.set_readonly(true);

            return;
        }
    }

    if (vSuju_type == '8') {
        alert("접수이후에 출하진행된 정보가 있으므로 기본정보는 수정 할 수 없고 삭제도 안됩니다."
            + " 필요하신 경우 주문승인 처리에서 건별 취소하시기 바랍니다");
        this.gf_mdi_btn_disable("delete");

        this.Div_detail.btn_detail_add.set_enable(false);
        this.Div_detail.btn_detail_delete.set_enable(false);

        this.Div_detail.btn_detail_mob_ok.set_visible(false);     // 모바일 접수 
        this.Div_detail.btn_detail_mob_cncl.set_visible(false);   // 모바일 취소 

        this.Div_content.set_enable(false);
        this.gd_detail.set_cssclass('readonly');
        this.gd_detail.set_readonly(true);
    }

    /*vRtn = this.gf_SelectSql_sync("ds_temp: SELECT COUNT(*)  FROM JPNOPRINT WHERE TAB_NM = 'SORDER' AND JPNO LIKE '"+vOrder_no+"' ", "SELECT_reffpf_5A", "ff_Callback_sync",0);
	
    if(vRtn[1] == 0 || NXCore.isEmpty(vRtn[1]) || vRtn[1] == '')
    {	
        this.Div_content.set_enable(true);
        this.gd_detail.set_cssclass('');
        this.gd_detail.set_readonly(false);		
    }	
    else
    {
        alert("접수이후에 출하진행된 정보가 있으므로 기본정보는 수정 할 수 없고 삭제도 안됩니다."
           +  " 필요하신 경우 주문승인 처리에서 건별 취소하시기 바랍니다");
        this.gf_mdi_btn_disable("delete");

        this.Div_detail.btn_detail_add.set_enable(false);
        this.Div_detail.btn_detail_delete.set_enable(false);
        this.Div_content.set_enable(false);
        this.gd_detail.set_cssclass('readonly');
        this.gd_detail.set_readonly(true);
    }*/

    if (vGwsts > 0) {
        alert("결재진행중인 주문이므로 수정,삭제할 수 없습니다");
        this.gf_mdi_btn_disable("update,delete");

        this.Div_detail.btn_detail_add.set_enable(false);
        this.Div_detail.btn_detail_delete.set_enable(false);
    }

    if (vSuju_sts > 0 || vGwsts > 0) {
        this.Div_content.ed_trans_cvcod.setFocus();
    }
    else {
        this.Div_content.ed_cvcod.setFocus();
    }

    // 20240611 계약 패키지마스타 단가 수정 제한 여부 로직 추가 -- 시작
    var vsql = "SELECT NVL(B.DANGA_LIMITYN, 'N') AS DANGA_LIMITYN FROM ESTIMATE_HEAD A, PKGMST B WHERE A.ESTNO = '" + vEstno + "' AND A.PKGNO = B.PKGNO(+) ";

    var vRtn1 = this.gf_SelectSql_sync("ds_temp:" + vsql, "SELECT_PKGDAN_LIMIT", "ff_Callback_sync", 0);
    if (vi_ErrorCode < 0) return false;
    if (this.ds_temp.getColumn(0, "DANGA_LIMITYN") == 'Y') {
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "ORDER_PRC"), 'edittype', 'none');
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "DANGBN"), 'edittype', 'none');
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "AMTGU"), 'edittype', 'none');
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "SOBI_CHK"), 'edittype', 'none');
    } else {
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "ORDER_PRC"), 'edittype', "expr:SUJU_STS == '4' ||  INVOICE_QTY > 0 || PICK_QTY > 0 ? 'none' :'masknumber'");
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "DANGBN"), 'edittype', "expr:DANGBN == '4' ? 'none' : 'combo'");
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "AMTGU"), 'edittype', "expr:SUJU_STS == '4' ||  INVOICE_QTY > 0 || PICK_QTY > 0 ? 'none' :'combo'");
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "SOBI_CHK"), 'edittype', 'checkbox');

    }
    // 20240611 계약 패키지마스타 단가 수정 제한 여부 로직 추가 -- 끝


}

this.ff_Object_onrbuttondown = function (obj: Edit, e: nexacro.MouseEventInfo) {
    var vs_Data = e.newvalue;
    var vs_Arg = '';
    var vn_Row = e.row;

    if (obj.readonly) return;		//readonly 상태 이면 팝업 취소 

    // Grid과 다른 object로 나눠서 처리 
    // obj가 Grid를 확인해서 처리함	
    if (obj == '[object Grid]') {

        if (obj.id == 'gd_detail') {
            switch (this.gf_GetCellBind(obj, e.cell, 'Body')) {
                case 'ITNBR':

                    var vOpenSale = new Array();

                    vOpenSale[0] = '1,7';  	            // 품목구분
                    vOpenSale[1] = null;		                // 사업장
                    vOpenSale[2] = this.gf_today();	            // 일자
                    vOpenSale[3] = null;		                // 거래처
                    vOpenSale[4] = null;		                // 통화
                    vOpenSale[5] = '3';		                // 통화기준
                    vOpenSale[6] = vs_Data;   // 품명
                    vOpenSale[8] = 'M';	            // 선택기준 M:Multi, S:Single
                    this.ff_co_popu_itemas_f_4("co_popu_itnbr_detail_rbtn", vOpenSale);

                    break;


            }
        }
    }

}



//화면 싸이즈 조정
this.ff_Screen = function () {
    //	ivChk = '0';  // 화면모드 0 : List(조회), 1 : 신규입력, 2 : 수정 또는 삭제,

    if (ivChk == '0') {
        this.gf_mdi_btn_disable("delete,save,cancel");
        this.gf_mdi_btn_enable("query,excel_chg");

        this.Div_content.set_visible(false);
        this.Div_detail.set_visible(false);
        this.gd_detail.set_visible(true);
        this.grd_list.set_visible(true);
        this.grd_history.set_visible(false);
        //yys
        this.gd_detail.set_cssclass('');
        this.gd_detail.set_readonly(false);

        this.gd_detail.set_left("2");
        this.gd_detail.set_top("67.00%");
        this.gd_detail.set_width("99.69%");
        this.gd_detail.set_bottom("0.39%");

        this.grd_list.set_left("2");
        this.grd_list.set_top("60");
        this.grd_list.set_width("99.69%");
        this.grd_list.set_bottom("34.00%");

        this.ds_head.setColumn(0, "GUBUN", '2');

        this.grd_list.set_enableredraw(false);     // 이문장을 적지 않으면 화면리사이즈 할경우 깨짐. 
        this.grd_list.set_enableredraw(true);
    }
    else {
        this.gf_mdi_btn_enable("delete,save,cancel");
        this.gf_mdi_btn_disable("query,excel_chg");

        this.grd_list.set_visible(false);
        this.grd_history.set_visible(true);
        this.gd_detail.set_cssclass('');
        this.gd_detail.set_readonly(false);


        this.Div_content.set_left("2");
        this.Div_content.set_top("60");
        this.Div_content.set_width("99.69%");
        this.Div_content.set_height("306");

        this.Div_detail.set_left("2");
        this.Div_detail.set_top("368");
        this.Div_detail.set_width("99.69%");
        this.Div_detail.set_height("32");

        this.gd_detail.set_left("2");
        this.gd_detail.set_top("403");
        this.gd_detail.set_width("99.69%");
        this.gd_detail.set_bottom("0.39%");

        this.grd_history.set_left("499");
        this.grd_history.set_top("190");

        this.Div_content.set_visible(true);
        this.Div_detail.set_visible(true);
        this.gd_detail.set_visible(true);

        this.Div_content.cbo_trans_sarea.set_visible(false);
        this.Div_content.ed_trans_cvcod.set_visible(true);
        this.Div_content.ed_cvnas1.set_visible(true);
        this.Div_content.ed_ownam1.set_visible(true);

        if (this.ds_list.getColumn(this.ds_list.rowposition, "MOB_GBN") == "1") {  // 모바일 주문 승인, 취소 버튼 처리 
            var vn_ok_cnt = 0, vn_cncl_cnt = 0;
            for (var i = 0; i < this.ds_detail.rowcount; i++) {
                if (NXCore.isEmpty(this.ds_detail.getColumn(i, "ORD_OK_DATE")) || this.ds_detail.getColumn(i, "ORD_OK_DATE") == "")
                    vn_ok_cnt++;
                else
                    vn_cncl_cnt++;
            }

            if (vn_ok_cnt > 0)
                this.Div_detail.btn_detail_mob_ok.set_visible(true);
            else
                this.Div_detail.btn_detail_mob_ok.set_visible(false);

            if (vn_cncl_cnt > 0)
                this.Div_detail.btn_detail_mob_cncl.set_visible(true);
            else
                this.Div_detail.btn_detail_mob_cncl.set_visible(false);
        }
        else {   // 모바일 주문 자료가 아니면 접수, 취소 버튼 제외 처리 
            this.Div_detail.btn_detail_mob_ok.set_visible(false);
            this.Div_detail.btn_detail_mob_cncl.set_visible(false);
        }
    }
}

//-----------------------------------------------------------------
//기능: 저장 이벤트 발생시 Check
//인수: vDw - Check 하고자하는 DataWindow Object 명
//반환: Number
//호출함수: jfRequiredChk(vDw, vRow)
//-----------------------------------------------------------------
this.ff_UpdateChk = function () {
    var vData, vData1, vAmt, vOrder_date, vDepot_no;

    // 잔액율이 0이면 처리할 수 없슴 ( 패키지 계약건만 )

    var vRate = this.ds_package.getColumn(0, "COMPUTE_13");
    var vGubun = this.ds_package.getColumn(0, "GUBUN");

    if (vGubun == '2' && vRate < 0) {
        alert("(저장)계약사용 잔액이 0% 이하입니다..\n계약내용을 확인하시기 바랍니다..");
        return -1;

        // 잔액 minus 출고를 막으려면 ////////////////////////
        //  return;
    }

    vOrder_date = this.ds_master.getColumn(0, "ORDER_DATE");

    if (NXCore.isEmpty(vOrder_date)) {
        alert("주문일자가 부정확합니다.!!");
        this.ds_master.setColumn(0, "ORDER_DATE", vToday);
        //       this.gf_cursor_setting(this.gd_main, 1, "order_date");
        return -1;
    }
    vData = this.ds_master.getColumn(0, "CVCOD");
    if (NXCore.isEmpty(vData)) {
        alert("계약처는 필수입니다.");
        //       this.gf_cursor_setting(this.gd_main, 1, "cvcod");
        return -1;
    }
    vData = this.ds_master.getColumn(0, "CON_CVCOD");
    if (NXCore.isEmpty(vData)) {
        alert("병원은 필수입니다.");
        //      this.gf_cursor_setting(this.gd_main, 1, "con_cvcod");
        return -1;
    }

    vData = this.ds_master.getColumn(0, "JI_EMPNO");
    if (vData == null || vData == '') {
        alert("지원담당은 필수입니다.");
        //      this.gf_cursor_setting(this.gd_main, 1, "ji_empno");
        return -1;
    }

    vData = this.ds_master.getColumn(0, "EMP_ID");

    if (NXCore.isEmpty(vData)) {
        alert("영업담당은 필수입니다.");
        //       this.gf_cursor_setting(this.gd_main, 1, "emp_id");
        return -1;
    }

    var vSql = "SELECT SERVICEKINDCODE, (SELECT CVCOD FROM VNDMST_EMP WHERE EMPNO = '" + vData + "') AS CVCOD FROM P1_MASTER WHERE EMPNO = '" + vData + "'";
    var vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_reffpf_5A", "ff_Callback_sync", 0);
    if (vi_ErrorCode < 0) return false;
    if (vRtn[0] == 0) {
        alert(" 영업담당자를 등록하세요.");
        return -1;
    } else
        if (vRtn[1] != '1' && (NXCore.isEmpty(vRtn[2]) || vRtn[2] == '')) {
            alert(" 영업담당자가 현재 재직중이 아닙니다.");
            return -1;
        }

    vDepot_no = this.ds_master.getColumn(0, "DEPOT_NO");
    if (NXCore.isEmpty(vDepot_no)) {
        alert("출하할 창고를 입력하세요.");
        //       this.gf_cursor_setting(this.gd_main, 1, "depot_no");
        return -1;
    }

    //택배인 경우 우편번호 는 필수

    var vTrans_gu = this.ds_trans.getColumn(0, "TRANS_GU");
    vData = this.ds_trans.getColumn(0, "POSNO");
    if (vTrans_gu == '01' || vTrans_gu == '02' || vTrans_gu == '06') {
        if (vData == null || vData == '') {
            alert("택배인 경우 우편번호는 필수입니다");
            //           this.gf_cursor_setting(this.gd_trans, 1, "POSNO");
            return -1;
        }
    }
    // 배송정보
    if (vTrans_gu == '02')
        vData = this.ds_trans.getColumn(0, "TRANS_SAREA");
    else vData = this.ds_trans.getColumn(0, "TRANS_CVCOD");

    if (NXCore.isEmpty(vDepot_no)) {
        alert("배송처는 필수입니다.");
        //      this.gf_cursor_setting(this.gd_trans, 1, "trans_cvcod");
        return -1;
    }

    vData = this.ds_trans.getColumn(0, "TRANS_HUMAN");
    if (NXCore.isEmpty(vData)) {
        alert("인수자명을 입력하세요.!!");
        //        this.gf_cursor_setting(this.gd_trans, 1, "trans_human");
        return;
    }
    vData = this.ds_trans.getColumn(0, "TRANS_TELNO");
    if (NXCore.isEmpty(vData)) {
        alert("연락처를 입력하세요.!!");
        //        this.gf_cursor_setting(this.gd_trans, 1, "trans_telno");
        return;
    }
    vData = this.ds_trans.getColumn(0, "TRANS_ADDR");
    if (NXCore.isEmpty(vData)) {
        alert("배송주소를 입력하세요.!!");
        //       this.gf_cursor_setting(this.gd_trans, 1, "trans_addr");
        return;
    }

    if (this.ds_detail.rowcount == 0) {
        alert("품목에 대한 정보가 없습니다");
        //        SetFocus(this.ds_detail);
        return;
    }

    var vSts;
    var vMusang = 0;
    var nOrdamt = 0;
    var nInsabt_cnt = 0;
    var nNinsabt_cnt = 0;
    var vEstno, vCon_spc_gbn, vIns_claim_yn, vSql, vRtn, vItnbr, vItcls, vInsabt_yn, vTax_gbn1;

    vInsabt_yn = this.gf_Getsyscnfg('S', 17, 2);

    //////////////////////////////////////////////////////
    /// 계약구분이 C_PLUS, 소액패키지 인지 확인한다.  ////
    //////////////////////////////////////////////////////

    vEstno = this.ds_master.getColumn(0, "ESTNO");
    if (!NXCore.isEmpty(vEstno)) {
        vSql = "SELECT CON_SPC_GBN, NVL(CONDAT, '20991231'), TAX_GBN1 FROM ESTIMATE_HEAD WHERE ESTNO = '" + vEstno + "'";
        vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_reffpf_5A", "ff_Callback_sync", 0);
        if (vi_ErrorCode < 0) return false;
        vCon_spc_gbn = vRtn[1];
        vTax_gbn1 = vRtn[3];

        if (vOrder_date < vRtn[2]) {
            alert(" 주문일자가 계약일자 보다 빠릅니다.");
            return -1;
        }

    } else vCon_spc_gbn = '0';

    for (i = 0; i < this.ds_detail.rowcount; i++) {
        vItnbr = this.ds_detail.getColumn(i, "ITNBR");
        if (NXCore.isEmpty(vItnbr)) {
            alert("형번은 필수입니다.");
            this.gf_cursor_setting(this.gd_detail, i, "ITNBR");
            return -1;
        }

        vAmt = this.ds_detail.getColumn(i, "ORDER_QTY");
        if (vAmt == null || vAmt == 0) {
            alert("주문수량이 없습니다.");
            this.gf_cursor_setting(this.gd_detail, i, "ORDER_QTY");
            return -1;
        }

        if (this.ds_detail.getColumn(i, "AMTGU") == 'Y') {
            vAmt = this.ds_detail.getColumn(i, "ORDER_PRC");
            if (vAmt == null || vAmt == 0) {
                alert("주문단가가 없습니다.");
                this.gf_cursor_setting(this.gd_detail, i, "ORDER_PRC");
                return -1;
            }
        }

        vData = this.ds_detail.getColumn(i, "CUST_NAPGI");
        if (NXCore.isEmpty(vData)) {
            alert("납기요구일이 없습니다..");
            this.gf_cursor_setting(this.gd_detail, i, "CUST_NAPGI");
            return -1;
        }

        this.ds_detail.setColumn(i, "MISAYU", this.ds_master.getColumn(0, "MISAYU"));

        //  무상이 있는지 확인
        if (this.ds_detail.getColumn(i, "OUT_GU") != 'O02' && this.ds_detail.getColumn(i, "ORDER_PRC") != 0) {
            vMusang = vMusang + 1;
        }

        // 패키지계약건으로 출고시 무상내역이 있으면 에러처리
        if (vGubun == '2' && vMusang > 0) {
            alert("패키지 계약으로 무상은 출고할 수 없습니다\n품목 내역중 무상출고건이 있으면 별도로 주문접수 하세요\n또는 무상은 단가를 0으로 하면 됩니다.");
            return -1;
        }

        ////////////////////////////////////////////////////////////////
        ///// 2019.02.18 재경팀 안효정 부장 요청으로
        ///// 이체단가 없을시 주문접수 안되게 수정
        ////////////////////////////////////////////////////////////////
        var vRtn = this.gf_SelectSql_sync("ds_temp: SELECT MAX(AMOUNT) FROM BUYDAN_TRANS WHERE CVCOD = '00020' AND ITNBR = '" + vItnbr + "'", "SELECT_reffpf_5A", "ff_Callback_sync", 3);
        if (NXCore.isEmpty(vRtn[1]) || vRtn[1] == '') {
            alert(i + 1 + "행에 이체단가가 없는 품목은 주문할 수 없습니다.");
            return;
        }


        ////////////////////////////////////////////////////////////////
        ///// 2016.07.11 병원영업부 김기현차장 요청과
        ///// 영업지원 송광현 과장의 승인으로 
        ///// 병원영업부의 보험팩 주문을 허용한다.
        ///// 단, 단가는 변경할 수 없다.
        ////////////////////////////////////////////////////////////////

        vIns_claim_yn = this.ds_detail.getColumn(i, "INS_CLAIM_YN");

        var vCvcod = this.ds_master.getColumn(0, "CVCOD");
        var vRtn = this.gf_SelectSql_sync("ds_temp: SELECT SAREA FROM VNDMST_SUB WHERE CVCOD = '" + vCvcod + "'", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
        if (vi_ErrorCode < 0) return false;
        var vSarea = vRtn[1];

        if (vSarea.substr(0, 2) == '01') {
            /////if (vIns_claim_yn == 'Y') {
            if (vIns_claim_yn != 'N') {
                var nQty = this.ds_detail.getColumn(i, "ORDER_QTY");
                var nPrc = this.ds_detail.getColumn(i, "ORDER_PRC");
                var nAmt = this.ds_detail.getColumn(i, "ORDER_AMT");

                vRtn = this.gf_SelectSql_sync("ds_temp: SELECT AMOUNT FROM BUYDAN WHERE ITNBR = '" + vItnbr + "' AND CODAT = "
                    + "(SELECT MAX(CODAT) FROM BUYDAN WHERE ITNBR = '" + vItnbr + "')", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
                if (vi_ErrorCode < 0) return false;

                var nUnitp = parseInt(vRtn[1]);

                if (nUnitp != nPrc || (nUnitp * nQty) != nAmt) {
                    alert(" AC 팩과 보험제품은 단가 변경할 수 없습니다.");
                    return -1;
                }
            }
        } else {

            ////////////////////////////////////////////////////////////
            ///// C_plus 계약으로는 보험팩만 주문 할 수 있다.
            ///// 기타 계약으로는 보험팩을 주문 할 수 없다.     
            ////////////////////////////////////////////////////////////
            if (vIns_claim_yn == 'Y') {
                if (vCon_spc_gbn != '8') {
                    alert(" C_plus 가 이닌 계약으로 보험팩을 주문할 수 없습니다.");
                    return -1;
                }
            } else {
                if (vCon_spc_gbn == '8') {
                    if (vIns_claim_yn != 'I') {
                        alert(" C_plus 로 비보험 제품을 주문할 수 없습니다.");
                        return -1;
                    }
                }
            }

            //////////////////////////////////////////////////////////////
            ///// 2016.08.17 송광현 팀장 요청으로
            ///// 실버제품은 제품계약으로만 출고할 수 있으며
            ///// 계산서 수금분 발행 계약으로는 출고할 수 없다.
            //////////////////////////////////////////////////////////////
            if (vIns_claim_yn == 'I') {
                if (vCon_spc_gbn != '1' && vCon_spc_gbn != '6' && vCon_spc_gbn != '7' && vCon_spc_gbn != '8') {
                    alert(i + "행 보험제품은 제품PAC, 소액, C_plus 로만 출고 가능합니다.");
                    return -1;
                }

                if (vTax_gbn1 == 'Y') {
                    alert(i + "행 계산서 수금분 발행 계약으로는 보험제품을 출고할 수 없습니다.");
                    return -1;
                }
            }
        }

        nOrdamt = nOrdamt + this.ds_detail.getColumn(i, "ORDER_AMT");

        ////////////////////////////////////////////////////////////////
        ///// C_plus 계약 주문 시 보철(ITCLS '02') 제품 중
        ///// 보험 제품과 비보험 제품을 하나의 주문으로 주문할 수 없다.
        ///// 환경변수 ('S', 17, 2) = 'N' 인 경우
        ////////////////////////////////////////////////////////////////

        vSql = "SELECT SUBSTR(ITCLS,1,2) FROM ITEMAS WHERE ITNBR = '" + vItnbr + "'";
        vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_reffpf_5A", "ff_Callback_sync", 0);
        if (vi_ErrorCode < 0) return false;
        vItcls = vRtn[1];

        if (vInsabt_yn == 'N') {
            if (vIns_claim_yn != 'N' && vItcls == '02') {
                nInsabt_cnt++;
            } else {
                nNinsabt_cnt++;
            }
        }
    }

    if (nInsabt_cnt != 0 && nNinsabt_cnt != 0) {
        alert(" 보험보철과 기타제품을 동시 주문할 수 없습니다.");
        return -1;
    }

    /////////////////////////////////////////////////////////////////////////////
    /////  100% 무상 주문을 통제하려 하였으나 SCREWDRIVER, 타사제품 교환 처리를
    /////  할 방법을 마련하기 전 까지는 통제 보유한다.
    /////////////////////////////////////////////////////////////////////////////
    //    if (nOrdamt == 0) {
    //        alert(" 전체 무상 출고는 접수 불가합니다. 출고요청 품의를 이용하세요.");
    //        return -1;
    //    }
    /////////////////////////////////////////////////////////////////////////////

    var vSql2 = "SELECT PKGNO , AMOUNT, USE_COMM_SOMO_CON_AMOUNT, PKGGU, CON_SPC_GBN FROM ESTIMATE_HEAD WHERE ESTNO = '" + vEstno + "'";
    var vRtn2 = this.gf_SelectSql_sync("ds_temp:" + vSql2, "SELECT_reffpf_5A", "ff_Callback_sync", 0);
    if ((this.ds_temp.getColumn(0, "PKGGU") == '02' || this.ds_temp.getColumn(0, "PKGGU") == '03' || this.ds_temp.getColumn(0, "PKGGU") == '04') && this.ds_temp.getColumn(0, "CON_SPC_GBN") == '1') {
        if (!NXCore.isEmpty(this.ds_temp.getColumn(0, "PKGNO")) && this.ds_temp.getColumn(0, "PKGNO") != '') {
            if (this.ds_temp.getColumn(0, "PKGNO") == '201809200002') {
                var nAmt = this.ds_temp.getColumn(0, "AMOUNT");
                var nSomo_amt = this.ds_temp.getColumn(0, "USE_COMM_SOMO_CON_AMOUNT");
                var nSumamt = this.gd_detail.getSummValue(8);
                if (nexacro.round(nAmt / 2, 0) < nexacro.round(nSomo_amt + nSumamt, 0)) {
                    alert('외부상품이 계약금액에 50%를 초과합니다.');
                    return;
                }
            }
        }
    }

    if (!NXCore.isEmpty(this.ds_master.getColumn(0, "ESTNO")) && this.ds_master.getColumn(0, "ESTNO") != "") {

        var vSql = "SELECT COUNT(*) FROM ESTIMATE_HEAD A, PKGMST B, PKGMST_LIMIT C WHERE A.ESTNO = '" + this.ds_master.getColumn(0, "ESTNO") + "' AND A.PKGNO IS NOT NULL AND A.PKGNO = B.PKGNO AND A.PKGNO = C.PKGNO";
        var vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_PKGLIMIT_CHK", "ff_Callback_sync", 0);
        if (vi_ErrorCode < 0) return false;

        if (vRtn[1] != 0) {
            if (this.fn_checkdata() == true) {
                if (this.ff_pkgmstlimit_Chk() == false) return -1;
            }
        }
    }

    return 0;
}
//--------------------------------------------------------------------
// 일반정보의 내역을 Detail에 Setting
//--------------------------------------------------------------------
this.ff_Detail_Set = function (vRow) {
    this.ds_detail.setColumn(vRow, "ORDER_DATE", this.ds_master.getColumn(0, "ORDER_DATE"));
    this.ds_detail.setColumn(vRow, "CVCOD", this.ds_master.getColumn(0, "CVCOD"));
    this.ds_detail.setColumn(vRow, "EMP_ID", this.ds_master.getColumn(0, "EMP_ID"));
    this.ds_detail.setColumn(vRow, "SAUPJ", this.ds_master.getColumn(0, "SAUPJ"));
    this.ds_detail.setColumn(vRow, "DEPOT_NO", this.ds_master.getColumn(0, "DEPOT_NO"));
    this.ds_detail.setColumn(vRow, "JI_EMPNO", this.ds_master.getColumn(0, "JI_EMPNO"));
    this.ds_detail.setColumn(vRow, "CON_CVCOD", this.ds_master.getColumn(0, "CON_CVCOD"));
    this.ds_detail.setColumn(vRow, "SAREA", this.ds_master.getColumn(0, "SAREA"));
    this.ds_detail.setColumn(vRow, "SUGUGB", this.ds_master.getColumn(0, "SUGUGB"));
    this.ds_detail.setColumn(vRow, "PANGB", this.ds_master.getColumn(0, "PANGB"));
    this.ds_detail.setColumn(vRow, "ESTNO", this.ds_master.getColumn(0, "ESTNO"));
}

//--------------------------------------------------------------------
// 거래처 배송정정보를 기준으로 setting
//--------------------------------------------------------------------
this.ff_Trans_Set = function (vCon_cvcod, vTrans_gu) {
    if (NXCore.isEmpty(vCon_cvcod)) return;
    //alert(vCon_cvcod+' | ' + vTrans_gu);
    // 거래처 배송정보를 기준으로 Setting시 사용

    if (vTrans_gu == '01' || vTrans_gu == '05') // 택배(고객), 영업담당직접인수
    {
        var vSql = " SELECT  '01',  B.CVCOD, B.TR_CVPLN, B.TR_TELNO, B.TR_ADDR1, B.TR_ADDR2, B.CVNAS2, B.OWNAM, B.TR_POSNO "
            + "   FROM  VNDMST B "
            + "  WHERE  B.CVCOD = '" + vCon_cvcod + "'  ";

        this.Div_content.cbo_trans_sarea.set_visible(false);
        this.Div_content.ed_trans_cvcod.set_visible(true);
        this.Div_content.ed_cvnas1.set_visible(true);
        this.Div_content.ed_ownam1.set_visible(true);
    }
    else if (vTrans_gu == '02') // 택배(영업소)
    {

        var i, vResult_sarea, vTsarea;

        vResult_sarea = this.gf_SelectSql_sync("ds_temp: select a.steamcd, b.trs_yn, decode(a.steamcd, '0735', a.steamcd, b.trs_sarea) from vndmst_sub a, sarea_addr b where a.cvcod = '" + vCon_cvcod + "' and a.sarea = b.cvcod(+)", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
        if (vi_ErrorCode < 0) return false;

        //var vSql = " SELECT  '02', B.CVCOD, B.CVPLN, B.TELNO1||'-'||B.TELNO2||'-'||B.TELNO3, B.ADDR1, B.ADDR2, B.CVNAS2, B.OWNAM, B.POSNO "
        //   + "   FROM  VNDMST B "
        //   + "  WHERE  B.CVCOD =   '"+vResult_sarea[1]+"' ";

        if (vResult_sarea[2] == 'N') {
            var vSql = " SELECT  '02', Z.DEPTCODE, B.HUMAN, B.TELNO, B.ADDR1, B.ADDR2, B.CVNAS, B.OWNAM, B.POSNO "
                + "   FROM  SAREA_ADDR B, SAREA Z "
                + "  WHERE  B.CVCOD =   '" + vResult_sarea[1] + "' AND B.CVCOD = Z.SAREA";
        }
        else {
            var vSql = " SELECT  '02', Z.DEPTCODE, B.HUMAN, B.TELNO, B.ADDR1, B.ADDR2, B.CVNAS, B.OWNAM, B.POSNO "
                + "   FROM  SAREA_ADDR B, SAREA Z "
                + "  WHERE  B.CVCOD =   '" + vResult_sarea[3] + "' AND B.CVCOD = Z.SAREA";
        }

        this.Div_content.cbo_trans_sarea.set_visible(true);
        this.Div_content.ed_trans_cvcod.set_visible(false);
        this.Div_content.ed_cvnas1.set_visible(false);
        this.Div_content.ed_ownam1.set_visible(false);
    }
    else if (vTrans_gu == '03') // 쿠기
    {
        var vSql = " SELECT  '03',  B.CVCOD, B.TR_CVPLN, B.TR_TELNO, B.TR_ADDR1, B.TR_ADDR2, B.CVNAS2, B.OWNAM, B.TR_POSNO "
            + "   FROM  VNDMST B "
            + "  WHERE  B.CVCOD = '" + vCon_cvcod + "'  ";

        this.Div_content.cbo_trans_sarea.set_visible(false);
        this.Div_content.ed_trans_cvcod.set_visible(true);
        this.Div_content.ed_cvnas1.set_visible(true);
        this.Div_content.ed_ownam1.set_visible(true);
    }
    else if (vTrans_gu == '04') // 퀵
    {
        var vSql = " SELECT  '04',  B.CVCOD, B.TR_CVPLN, B.TR_TELNO, B.TR_ADDR1, B.TR_ADDR2, B.CVNAS2, B.OWNAM, B.TR_POSNO "
            + "   FROM  VNDMST B "
            + "  WHERE  B.CVCOD = '" + vCon_cvcod + "'  ";

        this.Div_content.cbo_trans_sarea.set_visible(false);
        this.Div_content.ed_trans_cvcod.set_visible(true);
        this.Div_content.ed_cvnas1.set_visible(true);
        this.Div_content.ed_ownam1.set_visible(true);
    }
    else {
        var vSql = " SELECT  B.TR_GU, B.CVCOD, B.TR_CVPLN, B.TR_TELNO, B.TR_ADDR1, B.TR_ADDR2, B.CVNAS2, B.OWNAM, B.TR_POSNO "
            + "   FROM  VNDMST_TRANS A,  VNDMST B "
            + "  WHERE  A.CVCOD = '" + vCon_cvcod + "'  AND A.TRANS_CVCOD = B.CVCOD ";

        this.Div_content.cbo_trans_sarea.set_visible(false);
        this.Div_content.ed_trans_cvcod.set_visible(true);
        this.Div_content.ed_cvnas1.set_visible(true);
        this.Div_content.ed_ownam1.set_visible(true);
    }

    var vResult = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_VNDMST_TRANS", "ff_Callback_sync", 0);
    if (vi_ErrorCode < 0) return false;

    // 영업소일때 결과가 없으면 메시지 표시
    if (vTrans_gu == '02' && vResult[0] == '0') {
        alert("병원에 영업팀이 지정되어 있지 않아서 검색할 수 없습니다..\n거래처 등록에서 병원을 검색하여 담당영업팀을 지정후 사용하세요");
        return;
    }

    if (vResult[0] == '1') {
        this.ds_trans.set_enableevent(false);
        if (vResult[1].length > 2) vResult[1] = '01';
        this.ds_trans.setColumn(0, "TRANS_GU", vResult[1]);
        this.ds_trans.setColumn(0, "TRANS_CVCOD", vResult[2]);
        this.ds_trans.setColumn(0, "TRANS_SAREA", vResult[2]);
        this.ds_trans.setColumn(0, "TRANS_HUMAN", vResult[3]);
        this.ds_trans.setColumn(0, "TRANS_TELNO", vResult[4]);
        this.ds_trans.setColumn(0, "TRANS_ADDR", vResult[5]);
        this.ds_trans.setColumn(0, "TRANS_ADDR1", vResult[6]);
        this.ds_trans.setColumn(0, "CVNAS", vResult[7]);
        this.ds_trans.setColumn(0, "OWNAM", vResult[8]);
        this.ds_trans.setColumn(0, "POSNO", vResult[9]);
        this.ds_trans.set_enableevent(true);

    }
    else if (vResult[0] != '0') {
        // pdh  수정요 
        /*var vOrder_no = this.ds_master.getColumn(0, "ORDER_NO");
         var vOrder = vOrder_no.substr(0,12);
     	
         var vRtn = this.gf_SelectSql_sync("ds_temp: Select count(*) From jpnoprint Where tab_nm = 'SORDER' AND jpno = '" +  vOrder + "'  ", "SELECT_reffpf_5A", "ff_Callback_sync",0);
     	
         if(vRtn[1] > 0)
         {
             alert('이미 배송준비가 되어 수정할 수 없습니다.');
             this.ds_trans.setColumn(0, "TRANS_GU",    '');
             return;
         }*/
        this.Div_content_btn_trans_onclick();
    }

    // 가장 최근의 배송정보를 기준으로 setting시 사용
    //  var vSql = " SELECT  TRANS_GU, TRANS_CVCOD, TRANS_HUMAN, TRANS_TELNO, TRANS_ADDR, CVNAS2, A.POSNO "
    //           + "   FROM  SORDER_TRANS A,  VNDMST B "
    //       + "  WHERE  A.ORDER_NO  = ( SELECT SUBSTR(MAX(ORDER_NO), 1, 12) FROM SORDER WHERE CON_CVCOD = '"+vCon_cvcod+"' ) "
    //       + "    AND  A.TRANS_CVCOD = B.CVCOD ";
    //  var vResult = this.gf_SelectSql_sync("ds_temp:" + vSql , "SELECT_reffpf_5A", "ff_Callback_sync",0); 
    if (vi_ErrorCode < 0) return false;
    //
    //  if (vResult && vResult[0] != '0')
    //  {
    //      if (application.confirm("가장 최근에 배송정보가 있습니다.\n자동으로 Setting할까요?"))
    //      {
    //          this.ds_trans.setColumn(0, "TRANS_GU",       vResult[1]);
    //          this.ds_trans.setColumn(0, "TRANS_CVCOD",    vResult[2]);
    //          this.ds_trans.setColumn(0, "TRANS_HUMAN",    vResult[3]);
    //          this.ds_trans.setColumn(0, "TRANS_TELNO",    vResult[4]);
    //          this.ds_trans.setColumn(0, "TRANS_ADDR",     vResult[5]);
    //          this.ds_trans.setColumn(0, "CVNAS",      vResult[6]);
    //          this.ds_trans.setColumn(0, "OWNAM",      vResult[7]);
    //          this.ds_trans.setColumn(0, "POSNO",    vResult[8]);
    //      }
    //  }

    return;
}


this.ff_Trans_Data = function (vCloseParam) {
    // PDH 
    this.ds_trans.setColumn(0, "TRANS_GU", vCloseParam.vTrans_gu);
    this.ds_trans.setColumn(0, "TRANS_CVCOD", vCloseParam.vCvcod);
    this.ds_trans.setColumn(0, "TRANS_HUMAN", vCloseParam.vCvpln);
    this.ds_trans.setColumn(0, "TRANS_TELNO", vCloseParam.vTelno1);
    this.ds_trans.setColumn(0, "TRANS_ADDR", vCloseParam.vAddr1);
    this.ds_trans.setColumn(0, "TRANS_ADDR1", vCloseParam.vAddr2);
    this.ds_trans.setColumn(0, "CVNAS", vCloseParam.vCvnas);
    this.ds_trans.setColumn(0, "OWNAM", vCloseParam.vOwnam);
    this.ds_trans.setColumn(0, "POSNO", vCloseParam.vPosno);

    return;
}
//--------------------------------------------------------------------
// 영업팀별 창고 표시
//--------------------------------------------------------------------
this.ff_Depot = function (vEmpId) {
    var vSysId = application.gvs_sysid;
    // 부서,개인별 권한이 있는 창고만 표시 ( 단 시스템 관리자는 전체 )
    var vStock_dept, vStock_emp, vDeptcode;
    if (vSysId == 'Y') {
        vStock_dept = '%';
        vStock_emp = '%';
    }
    else {
        var vResult = this.gf_SelectSql_sync("ds_temp: select deptcode from p1_master where empno = '" + vEmpId + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
        if (vi_ErrorCode < 0) return false;
        vDeptcode = vResult[1];
        vStock_dept = vDeptcode;
        vStock_emp = vEmpId;
    }

    this.gf_combo_head_sync(this.ds_master, "DEPOT_NO", this.Div_content.cbo_depot_no, "co_dddw_depot_07_deptemp", vStock_dept + '|' + vStock_emp, 0);

    //출고 창고 셋팅
    var vSql = "SELECT    A.CVCOD AS CODE, B.CVNAS AS DATA     "
        + "       FROM     "
        + "         (     "
        + "                 SELECT    A.CVCOD, A.JUMAECHUL	"
        + "                   FROM    VNDMST_STOCK A     "
        + "                  WHERE    A.DEPTCODE LIKE '" + vDeptcode + "'      "
        + "                 AND   A.SOYOUJA = '2'     "
        + "                 AND   A.JUMAECHUL <> '8'   "
        + "                  UNION    ALL     "
        + "                 SELECT    A.CVCOD, B.JUMAECHUL    "
        + "                   FROM    VNDMST_STOCK_DEPT A, VNDMST_STOCK B     "
        + "                  WHERE    A.DEPTCODE LIKE '" + vDeptcode + "'      "
        + "                 AND   A.CVCOD = B.CVCOD     "
        + "                 AND   B.SOYOUJA = '2'     "
        + "                  UNION    ALL     "
        + "                 SELECT    A.CVCOD, B.JUMAECHUL     "
        + "                   FROM    DEPOT_EMP A, VNDMST_STOCK B     "
        + "                  WHERE    A.EMPNO LIKE '" + vDeptcode + "'      "
        + "                 AND   A.CVCOD = B.CVCOD     "
        + "                 AND   B.SOYOUJA = '2'     "
        + "         ) A, VNDMST B     "
        + "     WHERE    A.CVCOD = B.CVCOD     "
        + "     GROUP BY A.CVCOD, A.JUMAECHUL, B.CVNAS   "
        + "     HAVING A.CVCOD <> 'ZS100'   "
        + "     ORDER BY A.JUMAECHUL		"
    vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_DEPOT", "ff_Callback_sync", 0);
    if (vi_ErrorCode < 0) return false;

    this.ds_master.setColumn(0, "DEPOT_NO", this.ds_temp.getColumn(0, "CODE"));

    return;
}

//--------------------------------------------------------------------
//// 단가 Setting
//--------------------------------------------------------------------
this.ff_Danga = function (vItnbr, vRow, vTuncu, vCalcu) {
    // vCalcu : 강제로 소비자가 계산

    var vAmt = 0, vPrc, vVat, vUnit = 0, vDangbn;
    var vGubun = this.ds_package.getColumn(0, "GUBUN");
    var vPrice_type = this.ds_package.getColumn(0, "PRICE_TYPE");

    var vDanga, vSql, vRtn;

    if (vGubun == '1') {
        vDanga = this.ds_master.getColumn(0, "CVCOD");
        vDangbn = '1';
    }
    else if (vGubun == '3') {
        vDanga = '.';
        vDangbn = '3';
    }

    if (vCalcu == 'Sobi') {
        vGubun = '3';
        vDanga = '.';
        vDangbn = '3';
    }

    //// 납품단가, 일반업체 단가

    if (vGubun == '1' || vGubun == '3') {
        var vResult = this.gf_SelectSql_sync("ds_temp:  SELECT * FROM TABLE( PKG_SALE_004.PKG_SALE_004_BUYGRP('V04N00'||'" + vItnbr + "'||'^'||'" + vDanga + "'||'^'||TO_CHAR(SYSDATE, 'yyyymmdd')||'^'||'" + vTuncu + "'||'^') ) ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
        if (vi_ErrorCode < 0) return false;

        if (vResult[0] != '0') {
            this.ds_detail.setColumn(vRow, "ORDER_PRC", vResult[6]);
            vUnit = vResult[6];
            vAmt = Math.floor(parseFloat(vResult[6]) * this.ds_detail.getColumn(vRow, "ORDER_QTY"));
            vDanamt = vResult[6];
        }
    }
    else {
        var vEstno = this.ds_package.getColumn(0, "ESTNO");
        var vResult = this.gf_SelectSql_sync("ds_temp: SELECT * FROM TABLE ( PKG_SALE_016.PKG_SALE_016_DANGA('V03N00'||'" + vEstno + "'||'^'||'" + vItnbr + "'||'^'||'" + vItnbr + "'||'^') ) ",
            "SELECT_PKG_SALE_016_DANGA", "ff_Callback_sync", 0);
        if (vi_ErrorCode < 0) return false;

        if (NXCore.isEmpty(vResult[18])) {

            if (this.ds_package.getColumn(0, "CON_NEW_GBN") == '1') {
                vAmt = Math.floor(parseFloat(vResult[8]) * this.ds_detail.getColumn(vRow, "ORDER_QTY"));
                vUnit = vResult[8];
                vDanamt = vResult[7];
            }
            else {
                vAmt = Math.floor(parseFloat(vResult[11]) * this.ds_detail.getColumn(vRow, "ORDER_QTY"));
                vUnit = vResult[11];
                vDanamt = vResult[7];
            }

            //vDangbn = vResult[6];
            if (vResult[6] == '1' || this.ds_package.getColumn(0, "CON_SPC_GBN") == "F") {
                vDangbn = '2';
            }
            else {
                vDangbn = '3';
            }
        }
        else {
            this.ds_detail.setColumn(vRow, "ITNBR", '');
            this.ds_detail.setColumn(vRow, "PRODNM", '');
            this.ds_detail.setColumn(vRow, "ITDSC", '');
            this.ds_detail.setColumn(vRow, "ISPEC", '');
            this.ds_detail.setColumn(vRow, "ORDER_QTY", 0);
            this.ds_detail.setColumn(vRow, "ORDER_PRC", 0);
            this.ds_detail.setColumn(vRow, "ORDER_AMT", 0);
            this.ds_detail.setColumn(vRow, "DANAMT", 0);

            return;
        }
    }

    if (vUnit == 0 || this.ds_detail.getColumn(vRow, "AMTGU") == 'N') {
        this.ds_detail.setColumn(vRow, "ORDER_PRC", 0);
        this.ds_detail.setColumn(vRow, "ORDER_AMT", 0);
        this.ds_detail.setColumn(vRow, "UNPRC", 0);
        this.ds_detail.setColumn(vRow, "VATAMT", 0);
        this.ds_detail.setColumn(vRow, "DANGBN", '4');
        this.ds_detail.setColumn(vRow, "DANAMT", 0);

        this.ff_Real_calc();

    }
    else {
        this.ds_detail.setColumn(vRow, "ORDER_PRC", vUnit);
        this.ds_detail.setColumn(vRow, "ORDER_AMT", vAmt);
        this.ds_detail.setColumn(vRow, "DANAMT", vDanamt);

        if (vTuncu == 'KRW') {
            var vVat = Math.floor((vAmt * 10 / 11) * 0.1);
        }

        vPrc = Math.floor(vAmt - vVat);

        this.ff_Real_calc();

        this.ds_detail.setColumn(vRow, "UNPRC", vPrc);
        this.ds_detail.setColumn(vRow, "VATAMT", vVat);
        this.ds_detail.setColumn(vRow, "DANGBN", vDangbn);
    }

    // 20240220 의약품 수량별 단가 계산 로직 추가(시작)
    var vs_MedQty_chk = this.gf_SelectSql_sync("ds_temp: SELECT COUNT(*) AS CNT FROM MED_QTY_DANGA WHERE ITNBR = '" + vItnbr + "' AND USEYN = 'Y' AND CODAT <= '" + vToday + "' ", "SELECT_MED_QTY_DANGA_CHK", "ff_Callback_sync", 0);

    if (vs_MedQty_chk[1] != 0 && this.ds_detail.getColumn(vRow, "ORDER_QTY") != 0) {
        var vMedAmt = this.gf_Function_sync("FUN_GET_MED_QTY_DANGA", vItnbr + "|" + this.ds_detail.getColumn(vRow, 'CVCOD') + "|" + vToday + "|" + this.ds_detail.getColumn(vRow, "ORDER_QTY"), "FUNCTION", "ff_Callback_sync", 0);
        this.ds_detail.setColumn(vRow, "ORDER_PRC", vMedAmt);

        vAmt = Math.floor(parseFloat(vMedAmt) * this.ds_detail.getColumn(vRow, "ORDER_QTY"));
        vVat = Math.floor((vAmt * 10 / 11) * 0.1);
        vPrc = Math.floor(vAmt - vVat);

        this.ds_detail.setColumn(vRow, "ORDER_AMT", vAmt);
        this.ds_detail.setColumn(vRow, "UNPRC", vPrc);
        this.ds_detail.setColumn(vRow, "VATAMT", vVat);
        this.ds_detail.setColumn(vRow, "DANAMT", vMedAmt);

    }
    // 20240220 의약품 수량별 단가 계산 로직 추가(끝)

    return;


}
//--------------------------------------------------------
//
//------------------------------------------------------------------
this.ff_Package_Reset = function (vCvcod, vEstno) {
    var vGuun;
    this.ds_master.setColumn(0, "ESTNO", null);

    this.ds_package.clearData();
    //this.ds_history.clearData();
    this.ds_package.insertRow(0);
    this.gsi_dataset_zero_set(this.ds_package, 0, "GUBUN^3");
    if (vCvcod == 'NONE') return;

    //var vRrr2 = this.gf_SelectSql_sync("ds_temp: SELECT * FROM TABLE (PKG_SALE_COMM_004.PKG_SALE_COMM_004_SALEJAN('V06N0010^.^ZZZZZZ^.^201101^201112^') )", "SELECT_reffpf_5A", "ff_Callback_sync",0);
    //       if (vi_ErrorCode < 0) return false;
    //var vRrr2 = this.gf_SelectSql_sync("ds_temp: Select  * FROM TABLE ( PKG_SALE_017.PKG_SALE_017_HANDO('"+ vArg +"') )", "SELECT_reffpf_5A", "ff_Callback_sync",0);
    //       if (vi_ErrorCode < 0) return false;

    var vArg = 'V03N00' + vCvcod + '^' + vEstno + '^2^';

    //trace(vArg);
    var vSql = "SELECT * FROM TABLE ( PKG_SALE_014.PKG_SALE_014_EST('" + vArg + "') ) ";
    var vResult = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_PKG_SALE_014_EST", "ff_Callback_sync", 0);
    if (vi_ErrorCode < 0) return false;

    if (vResult) {
        for (i = 0; i < 36; i++) {
            this.ds_package.setColumn(0, i, vResult[i + 1]);
        }

        var vPrvrst = this.gf_SelectSql_sync("ds_temp: select a.prv_amount, fun_get_reffpf('5O', a.pkggu), nvl(b.janamt,0) from estimate_head a, estimate_head_keep b "
            + " where a.estno = '" + vResult[3] + "' and a.estno = b.estno (+) ", "SELECT_estimate_head", "ff_Callback_sync", 0);
        if (vi_ErrorCode < 0) return false;

        this.ds_package.setColumn(0, "PRVAMT", vPrvrst[1]);
        this.ds_package.setColumn(0, "PRV_AMOUNT", vPrvrst[1]);
        this.ds_package.setColumn(0, "PKGNAME", vPrvrst[2]);
        this.ds_package.setColumn(0, "BOKWAN", vPrvrst[3]);

        this.ff_LeaseSet(vResult[3]);

        // 잔액율이 0이면 처리할 수 없슴
        var vRate = this.ds_package.getColumn(0, "COMPUTE_13");
        var vGubun = this.ds_package.getColumn(0, "GUBUN");
        if (vGubun == '2' && vRate < 0) {
            alert("계약사용 잔액이 0% 이하입니다..\n계약내용을 확인하세요..");
            //return;
        }
    }

    if (this.ff_Allowchk('1', vCvcod, '') == -1) {
        return;
    }

    if (vResult[2] == '1') {

        this.ds_master.setColumn(0, "ESTNO", null);
        alert("납품단가 계약단가 기준으로 계산 적용됩니다");
    }
    else
        if (vResult[2] == '2') {
            if (vResult[26] == '0') {

                this.ds_master.setColumn(0, "ESTNO", null);
                alert("계약업체인데 계약내용을 검색하지 못했습니다,..!!");
                vResult[2] = '4';
            }
            else if (vResult[26] == '1') {

                if (vResult[3] == '%' || vResult[3] == '' || vResult[3] == null)
                    vGubun = '1';
                else vGubun = '2';


                if (this.ff_Allowchk(vGubun, vCvcod, vResult[3]) == -1)
                    return;

                this.ds_master.setColumn(0, "ESTNO", vResult[3]);
                //this.ff_Danga_Full();

                ////////////////////////////////////////////////////////////////////
                //** 수금이 안되면 출고를 못하게 하는건 여기서 처리할 수 있겠다.....
                ////////////////////////////////////////////////////////////////////
                var nSugum, nChul, nBack, nPrv;
                var vSql, vRtn;

                vSql = "SELECT TAX_GBN4, CON_SPC_GBN, FO_SUDAT, B.PKGGU, B.PKGNAME, C.PRICE_TYPE, A.CON_NEW_GBN, A.CONDAT, A.ESTSTS "
                    + "  FROM ESTIMATE_HEAD A, PKGMST B, ESTIMATE_HEAD_RMK C "
                    + " WHERE A.ESTNO = '" + vResult[3] + "' AND A.PKGNO = B.PKGNO(+) AND A.ESTNO = C.ESTNO(+)";
                vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_ESTIMATE_HEAD", "ff_Callback_sync", 0);
                if (vi_ErrorCode < 0) return false;

                if (vRtn[2] == 'C') {
                    alert(" NMR 은 동종골만 주문 가능합니다.");
                    this.ds_master.setColumn(0, "ESTNO", '');
                    this.ds_package.clearData();
                    this.ds_package.insertRow(0);
                    vResult[2] = '3';

                    alert("주문단가는 소비자가로 계산 적용됩니다(21)");
                    this.ff_Danpum_Limit(vCvcod);
                    return;
                }

                this.ds_package.setColumn(0, "CON_SPC_GBN", vRtn[2]);
                this.ds_package.setColumn(0, "PRICE_TYPE", vRtn[6]);

                nSugum = this.ds_package.getColumn(0, "USE_SUGUM_AMOUNT");
                nChul = this.ds_package.getColumn(0, "TOT_CHUL");
                nBack = this.ds_package.getColumn(0, "TOT_BACK");
                nPrv = this.ds_package.getColumn(0, "PRVAMT");

                /////////////////////////////////////////////////////////////////
                ///// 2015.12.07 보험 계약은 수금분 초과해도 주문 접수한다. /////
                /////                        백팀장 요청, 최실장 확인       /////
                /////////////////////////////////////////////////////////////////

                //if (vRtn[1] != 'Y' && vResult[26] == 1 && (nChul - nBack >= nSugum + nPrv)) {

                if (vRtn[7] != '1' && vRtn[1] != 'Y' && vResult[26] == 1 && (nChul - nBack >= nSugum + nPrv) &&
                    vRtn[2] != '6' && vRtn[2] != '8' && ivAllow != 'Y') {
                    alert(" 수금액을 초과하여 출고할 수 없습니다. 해당 계약으로 주문 접수 불가합니다.");

                    this.ds_master.setColumn(0, "ESTNO", null);
                    this.ds_package.clearData();
                    this.ds_package.insertRow(0);
                    this.gsi_dataset_zero_set(this.ds_package, 0, "GUBUN^3");
                    vResult[2] = '3';


                    alert("주문단가는 소비자가로 계산 적용됩니다(1)");
                    this.ff_Danpum_Limit(vCvcod);
                } else {

                    ////// 앞에서 함께 읽도록 수정한다.
                    //////var vPkgSql  = this.gf_SelectSql_sync("ds_temp: SELECT fo_sudat, con_spc_gbn FROM Estimate_head where estno = '"+vResult[3]+"' ", "SELECT_reffpf_5A", "ff_Callback_sync",0);

                    /////////////////////////////////
                    ///// 보험 계약 경고 메세지 /////
                    /////////////////////////////////
                    if (vRtn[2] == '6') {
                        alert("선택하신 패키지는 소액패키지로서 Fixture 와 Abutment 만 출고 가능합니다.");
                    }
                    else if (vRtn[2] == '8') {

                        alert("선택하신 패키지는 C plus로 정가로 출고 됩니다.");
                    }
                    else if (vRtn[4] == '05') {

                        alert("선택하신 패키지는 노마진 적용 계약입니다.\n" + vRtn[5]);
                    }

                    if (vRtn[3] == null || vRtn[3] == '') {

                        this.ds_master.setColumn(0, "ESTNO", vResult[3]);
                        //this.ff_Danga_Full();

                        //var vRrr2 = this.gf_SelectSql_sync("ds_temp: Select  * FROM TABLE ( PKG_SALE_017.PKG_SALE_017_HANDO('"+ vResult[3] +"'))", "SELECT_reffpf_5A", "ff_Callback_sync",0);
                        if (vi_ErrorCode < 0) return false;
                        var vRrr2 = this.gf_SelectSql_sync("ds_temp: SELECT A.*, B.USE_SUGUM_AMOUNT FROM TABLE (PKG_SALE_017.PKG_SALE_017_HANDO('" + vResult[3] + "')) A, "
                            + " ESTIMATE_HEAD B WHERE B.ESTNO = '" + vResult[3] + "'", "SELECT_PKG_SALE_017_HANDO", "ff_Callback_sync", 0);
                        if (vi_ErrorCode < 0) return false;

                        //this.ff_Package_Reset(vCvcod, vResult[3]);

                        this.ff_LeaseSet(vResult[3]);

                        this.ds_package.setColumn(0, "ORDAMT", Math.floor(parseFloat(vRrr2[9]) + parseFloat(vRrr2[15]) + parseFloat(vRrr2[21]) + parseFloat(vRrr2[27])
                            + parseFloat(vRrr2[33]) + parseFloat(vRrr2[39]) + parseFloat(vRrr2[45]) + parseFloat(vRrr2[51])));
                    }
                    else {
                        alert("팩 계약은 있으나 현재 사용할수 있는 계약이 아닙니다..\n계약금액 조정에서 사용정지가 되어있는지 확인하세요..(A)!!");
                        this.ds_master.setColumn(0, "ESTNO", null);
                        this.ds_package.clearData();
                        this.ds_package.insertRow(0);
                        this.gsi_dataset_zero_set(this.ds_package, 0, "GUBUN^3");
                        vResult[2] = '3';


                        alert("주문단가는 소비자가로 계산 적용됩니다(2)");
                        this.ff_Danpum_Limit(vCvcod);
                    }
                }


            }
            else if (vResult[26] >= '02') {
                alert("현재 잔여계약이 1건 이상입니다..!!\n적용할 계약서를 선택하세요! ");

                var vModResult = this.gf_showPopup('estimate_popup', "sm_send::sm_send_estimate_q_f.xfdl", { width: 1210, height: 500 },
                    {
                        OpenRetv: 'Y',   // popup open 즉시 조회  
                        MultSelect: 'N',   // MULTI LINE 선택
                        Argument: vCvcod + '|' + 'O'  // 조회조건 파라메터 
                    }, { modal: true, layered: true, autosize: false, callback: "ff_AfterPopup" });

                /* if (vModResult) 
                 {
                     //this.ds_master.set_enableevent(false);
                     this.ds_master.setColumn(0, "ESTNO", vModResult[3]);
                     //this.ds_master.set_enableevent(true);
     
                     this.ff_Package_Reset(vCvcod, vModResult[3]);
                     this.ff_LeaseSet(vModResult[3]);
                 }
                 else 
                 {
                     this.ds_master.setColumn(0, "ESTNO", null);
                     this.ds_package.clearData();
                     this.ds_package.insertRow(0);
                     this.gsi_dataset_zero_set(this.ds_package, 0, "GUBUN^3");
                     vResult[2] = '3';
     
                     // 총 미수금액은 Setting
                     var vArg    = 'V06N0010^'+vCvcod+'^'+vCvcod+'^.^'+vToday.substr(0,6)+'^'+vToday.substr(0,6)+'^';
                     var vIwrst  = this.gf_SelectSql_sync("ds_temp: SELECT NVL(IWOL_CREDIT_AMT, 0) + NVL(MAECHUL_AMT, 0) + NVL(MAECHUL_VAT, 0) - NVL(SAVE_AMT, 0) FROM TABLE (PKG_SALE_COMM_004.PKG_SALE_COMM_004_SALEJAN('"+vArg+"') ) ", "SELECT_reffpf_5A", "ff_Callback_sync",0);
                     //var vIwrst  = this.gf_SelectSql_sync("ds_temp: SELECT NVL(IWOL_CREDIT_AMT, 0) + NVL(MAECHUL_AMT, 0) - NVL(SAVE_AMT, 0) FROM TABLE (PKG_SALE_COMM_004.PKG_SALE_COMM_004_SALEJAN('"+vArg+"') ) ", "SELECT_reffpf_5A", "ff_Callback_sync",0);
                if (vi_ErrorCode < 0) return false;
                 	
                     this.ds_package.setColumn(0, "IWOL_AMT", vIwrst[1]);
                     
                    
                     alert("주문단가는 소비자가로 계산 적용됩니다(3)");
                     this.ff_Danpum_Limit(vCvcod);
                 }*/
            }
        }
        else if (vResult[2] == '3') {
            this.ds_master.setColumn(0, "ESTNO", null);

            alert("주문단가는 소비자가로 계산 적용됩니다(4)");
            this.ff_Danpum_Limit(vCvcod);
        }
        else {
            this.ds_master.setColumn(0, "ESTNO", null);
            alert("단가 구분을 검색할 수 없습니다.");
            vResult[2] = '4';
        }

    this.ds_package.setColumn(0, "GUBUN", vResult[2]);

    // 20240611 계약 패키지마스타 단가 수정 제한 여부 로직 추가 -- 시작
    var vsql = "SELECT NVL(B.DANGA_LIMITYN, 'N') AS DANGA_LIMITYN FROM ESTIMATE_HEAD A, PKGMST B WHERE A.ESTNO = '" + vEstno + "' AND A.PKGNO = B.PKGNO(+) ";

    var vRtn1 = this.gf_SelectSql_sync("ds_temp:" + vsql, "SELECT_PKGDAN_LIMIT", "ff_Callback_sync", 0);
    if (vi_ErrorCode < 0) return false;
    if (this.ds_temp.getColumn(0, "DANGA_LIMITYN") == 'Y') {
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "ORDER_PRC"), 'edittype', 'none');
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "DANGBN"), 'edittype', 'none');
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "AMTGU"), 'edittype', 'none');
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "SOBI_CHK"), 'edittype', 'none');
    } else {
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "ORDER_PRC"), 'edittype', "expr:SUJU_STS == '4' ||  INVOICE_QTY > 0 || PICK_QTY > 0 ? 'none' :'masknumber'");
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "DANGBN"), 'edittype', "expr:DANGBN == '4' ? 'none' : 'combo'");
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "AMTGU"), 'edittype', "expr:SUJU_STS == '4' ||  INVOICE_QTY > 0 || PICK_QTY > 0 ? 'none' :'combo'");
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "SOBI_CHK"), 'edittype', 'checkbox');

    }
    // 20240611 계약 패키지마스타 단가 수정 제한 여부 로직 추가 -- 끝

    //////////////////////////////////////////////////////////////////////
    ///// 특약에 등록된 품목 중에서만 주문을 할 수 있도록 한다.      /////
    //////////////////////////////////////////////////////////////////////

    if (this.ds_package.getColumn(0, "CON_SPC_GBN") == '2' &&
        this.ds_package.getColumn(0, "CONDAT") >= "20160101") {
        //pdh   this.btnCntr.style.visibility = "visible";
        // pdh  this.btnExp.style.visibility = "hidden";

        this.Div_detail.btn_detail_delete.set_enable(true);
        this.Div_detail.btn_detail_add.set_enable(true);
        //this.Div_detail.btn_detail_delete.set_enable(false);   @@@@@@@@@@@  2018.03.12  이양헌 수정(김승태 위원님 요청) 
        //this.Div_detail.btn_detail_add.set_enable(false);      @@@@@@@@@@@  2018.03.12  이양헌 수정(김승태 위원님 요청)

        // pdh *conv*"  this.ds_detail.Modify("DataWindow.ReadOnly = Yes");       
    } else {
        // pdh this.btnCntr.style.visibility = "hidden";
        // pdh  this.btnExp.style.visibility = "visible";
        this.Div_detail.btn_detail_delete.set_enable(true);
        this.Div_detail.btn_detail_add.set_enable(true);
        // pdh *conv*"  this.ds_detail.Modify("DataWindow.ReadOnly = No"); 
    }

    //////////////////////////////////////////////////////////////////////

    return;
}


this.ff_Package_Reset_Inquery = function (vCvcod, vEstno) {
    this.ds_master.setColumn(0, "ESTNO", null);

    this.ds_package.clearData();
    //this.ds_history.clearData();
    this.ds_package.insertRow(0);
    this.gsi_dataset_zero_set(this.ds_package, 0, "GUBUN^3");
    if (vCvcod == 'NONE') return;


    //var vRrr2 = this.gf_SelectSql_sync("ds_temp: SELECT * FROM TABLE (PKG_SALE_COMM_004.PKG_SALE_COMM_004_SALEJAN('V06N0010^.^ZZZZZZ^.^201101^201112^') )", "SELECT_reffpf_5A", "ff_Callback_sync",0);
    if (vi_ErrorCode < 0) return false;
    //var vRrr2 = this.gf_SelectSql_sync("ds_temp: Select  * FROM TABLE ( PKG_SALE_017.PKG_SALE_017_HANDO('"+ vArg +"') )", "SELECT_reffpf_5A", "ff_Callback_sync",0);
    if (vi_ErrorCode < 0) return false;

    var vArg = 'V03N00' + vCvcod + '^' + vEstno + '^1^';
    var vSql = "SELECT  * FROM TABLE ( PKG_SALE_014.PKG_SALE_014_EST('" + vArg + "') ) ";
    var vResult = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_PKG_SALE_014_EST", "ff_Callback_sync", 0);
    if (vi_ErrorCode < 0) return false;

    if (vResult) {
        for (i = 0; i < 36; i++) {
            this.ds_package.setColumn(0, i, vResult[i + 1]);

        }
        var vPrvrst = this.gf_SelectSql_sync("ds_temp: select a.prv_amount, fun_get_reffpf('5O', a.pkggu), nvl(b.janamt,0) from estimate_head a, estimate_head_keep b where a.estno = '" + vResult[3] + "' and a.estno = b.estno (+) ",
            "SELECT_estimate_head", "ff_Callback_sync", 0);
        if (vi_ErrorCode < 0) return false;

        this.ds_package.setColumn(0, "PRVAMT", vPrvrst[1]);
        this.ds_package.setColumn(0, "PRV_AMOUNT", vPrvrst[1]);
        this.ds_package.setColumn(0, "PKGNAME", vPrvrst[2]);
        this.ds_package.setColumn(0, "BOKWAN", vPrvrst[3]);

        this.ff_LeaseSet(vResult[3]);

        ////////////////////////////////////////////////////////////////////
        ///// 잔액율이 0이면 처리할 수 없슴
        ///// * 과거에 어떤 RULE 이 있었던 것같으나 확인할 수 없고
        /////   새로운 RULE 로 수정해야 할 필요가 있다. 어떻게 해야 하나..
        ////////////////////////////////////////////////////////////////////
        var vRate = this.ds_package.getColumn(0, "COMPUTE_13");
        var vGubun = this.ds_package.getColumn(0, "GUBUN");
        if (vGubun == '2' && vRate < 0) {
            alert("계약사용 잔액이 0% 이하입니다..\n계약내용을 확인하세요!!");
            //return;
        }
    }

    if (vResult[2] == '1') {
        this.ds_master.setColumn(0, "ESTNO", null);
        alert("납품단가 계약단가 기준으로 계산 적용됩니다");
    }
    else if (vResult[2] == '2') {

        if (vResult[26] == '0') {
            this.ds_master.setColumn(0, "ESTNO", null);
            alert("계약업체인데 계약내용을 검색하지 못했습니다,..!!");
            vResult[2] = '4';
        }
        else if (vResult[26] == '1') {
            var nSugum, nChul, nBack;
            var vSql, vRtn;

            vSql = "SELECT TAX_GBN4, CON_SPC_GBN, FO_SUDAT, B.PRICE_TYPE, CON_NEW_GBN, CONDAT, ESTSTS FROM ESTIMATE_HEAD A, ESTIMATE_HEAD_RMK B "
                + " WHERE A.ESTNO = '" + vResult[3] + "' AND A.ESTNO = B.ESTNO(+)";
            vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_ESTIMATE_HEAD", "ff_Callback_sync", 0);
            if (vi_ErrorCode < 0) return false;

            this.ds_package.setColumn(0, "CON_SPC_GBN", vRtn[2]);
            this.ds_package.setColumn(0, "PRICE_TYPE", vRtn[4]);

            var nSugum = this.ds_package.getColumn(0, "USE_SUGUM_AMOUNT");
            var nChul = this.ds_package.getColumn(0, "TOT_CHUL");
            var nBack = this.ds_package.getColumn(0, "TOT_BACK");
            var nPrv = this.ds_package.getColumn(0, "PRVAMT");

            var vCntrl_yn = this.gf_Getsyscnfg('S', 22, '01');
            var vCntrl_ymd = this.gf_Getsyscnfg('S', 22, '02');
            var vCntrl_stat = this.gf_Getsyscnfg('S', 22, '03');

            /////////////////////////////////////////////////////////////////
            ///// 2015.12.07 보험 계약은 수금분 초과해도 주문 접수한다. /////
            /////                        백팀장 요청, 최실장 확인       /////
            /////////////////////////////////////////////////////////////////

            ////if (vRtn[1] != 'Y' && vResult[26] == 1 && (nChul - nBack > nSugum + nPrv)) {

            if (vRtn[5] != '1' && vRtn[1] != 'Y' && vResult[26] == 1 && (nChul - nBack > nSugum + nPrv) &&
                vRtn[2] != '1' && vRtn[2] != '6' && vRtn[2] != '8') {
                alert(" 기출고금액이 수금액을 초과하여 해당 계약으로 주문 접수 불가합니다.");

                this.ds_master.setColumn(0, "ESTNO", null);
                this.ds_package.clearData();
                this.ds_package.insertRow(0);
                this.gsi_dataset_zero_set(this.ds_package, 0, "GUBUN^3");
                vResult[2] = '3';

                alert("주문단가는 소비자가로 계산 적용됩니다(5)");
                this.ff_Danpum_Limit(vCvcod);
            }
            else if (vCntrl_yn == 'Y') {
                if (vCntrl_ymd >= vRtn[6]) {
                    if (vCntrl_stat.search(vRtn[7]) > 1) {
                        if (vRtn[1] != 'Y') {
                            var vQry = "select fun_get_estallow('" + vCvcod + "', '" + vResult[3] + "') from dual";
                            var vRet = this.gf_SelectSql_sync("ds_temp:" + vQry, "SELECT_ESTIMATE_HEAD", "ff_Callback_sync", 0);

                            if (vRet == 'N') {
                                alert(" 해당 계약은 " + vCntrl_ymd + " 이전 계약으로 주문 불가합니다.");

                                this.ds_master.setColumn(0, "ESTNO", null);
                                this.ds_package.clearData();
                                this.ds_package.insertRow(0);
                                this.gsi_dataset_zero_set(this.ds_package, 0, "GUBUN^3");
                                vResult[2] = '3';

                                alert("주문단가는 소비자가로 계산 적용됩니다(1)");
                                this.ff_Danpum_Limit(vCvcod);
                            }
                            else if (vRtn[3] == null || vRtn[3] == '') {
                                this.ds_master.setColumn(0, "ESTNO", vResult[3]);

                                var vRrr2 = this.gf_SelectSql_sync("ds_temp: Select  * FROM TABLE ( PKG_SALE_017.PKG_SALE_017_HANDO('" + vResult[3] + "') )", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
                                if (vi_ErrorCode < 0) return false;
                                this.ds_package.setColumn(0, "ORDAMT", Math.floor(parseFloat(vRrr2[9]) + parseFloat(vRrr2[15]) + parseFloat(vRrr2[21]) + parseFloat(vRrr2[27])
                                    + parseFloat(vRrr2[33]) + parseFloat(vRrr2[39]) + parseFloat(vRrr2[45]) + parseFloat(vRrr2[51])));
                                this.ff_LeaseSet(vResult[3]);
                            }
                        }
                    }
                }
            }
            else {
                if (vRtn[3] == null || vRtn[3] == '') {
                    this.ds_master.setColumn(0, "ESTNO", vResult[3]);

                    var vRrr2 = this.gf_SelectSql_sync("ds_temp: Select  * FROM TABLE ( PKG_SALE_017.PKG_SALE_017_HANDO('" + vResult[3] + "') )", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
                    if (vi_ErrorCode < 0) return false;
                    this.ds_package.setColumn(0, "ORDAMT", Math.floor(parseFloat(vRrr2[9]) + parseFloat(vRrr2[15]) + parseFloat(vRrr2[21]) + parseFloat(vRrr2[27])
                        + parseFloat(vRrr2[33]) + parseFloat(vRrr2[39]) + parseFloat(vRrr2[45]) + parseFloat(vRrr2[51])));
                    this.ff_LeaseSet(vResult[3]);

                }
                else {
                    alert("팩 계약은 있으나 현재 사용할수 있는 계약이 아닙니다..\n계약금액 조정에서 사용정지가 되어있는지 확인하세요..(A)!!");
                    this.ds_master.setColumn(0, "ESTNO", null);
                    this.ds_package.clearData();
                    this.ds_package.insertRow(0);
                    this.gsi_dataset_zero_set(this.ds_package, 0, "GUBUN^3");
                    vResult[2] = '3';

                    alert("주문단가는 소비자가로 계산 적용됩니다(6)");
                    this.ff_Danpum_Limit(vCvcod);
                }
            }
        }
        else if (vResult[26] >= '02') {
            alert("현재 잔여계약이 1건 이상입니다..!!\n적용할 계약서를 선택하세요. ");

            var vOpenParam = new Array;
            vOpenParam[0] = vCvcod;
            vOpenParam[1] = 'O';
            var vModResult = OpenModal("sm/send/sm_send_estimate_q.aspx", vOpenParam, 960, 500);

            if (vModResult) {
                this.ds_master.setColumn(0, "ESTNO", vModResult[3]);

                this.ff_Package_Reset(vCvcod, vModResult[3]);
                this.ff_LeaseSet(vModResult[3]);
            }
            else {
                this.ds_master.setColumn(0, "ESTNO", null);
                this.ds_package.clearData();
                this.ds_package.insertRow(0);
                this.gsi_dataset_zero_set(this.ds_package, 0);
                vResult[2] = '3';

                // 총 미수금액은 Setting
                var vArg = 'V06N0010^' + vCvcod + '^' + vCvcod + '^.^' + vToday.substr(0, 6) + '^' + vToday.substr(0, 6) + '^';
                //alert(vArg);
                var vIwrst = this.gf_SelectSql_sync("ds_temp: SELECT NVL(IWOL_CREDIT_AMT, 0) + NVL(MAECHUL_AMT, 0) + NVL(MAECHUL_VAT, 0) - NVL(SAVE_AMT, 0) FROM TABLE (PKG_SALE_COMM_004.PKG_SALE_COMM_004_SALEJAN('" + vArg + "') ) ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
                //var vIwrst  = this.gf_SelectSql_sync("ds_temp: SELECT NVL(IWOL_CREDIT_AMT, 0) + NVL(MAECHUL_AMT, 0) - NVL(SAVE_AMT, 0) FROM TABLE (PKG_SALE_COMM_004.PKG_SALE_COMM_004_SALEJAN('"+vArg+"') ) ", "SELECT_reffpf_5A", "ff_Callback_sync",0);
                if (vi_ErrorCode < 0) return false;

                this.ds_package.setColumn(0, "IWOL_AMT", vIwrst[1]);

                alert("주문단가는 소비자가로 계산 적용됩니다(7)");
                this.ff_Danpum_Limit(vCvcod);
            }
        }
    }
    else if (vResult[2] == '3') {
        this.ds_master.setColumn(0, "ESTNO", null);

        alert("주문단가는 소비자가로 계산 적용됩니다(8)");
        this.ff_Danpum_Limit(vCvcod);
    }
    else {
        this.ds_master.setColumn(0, "ESTNO", null);
        alert("단가 구분을 검색할 수 없습니다.");
        vResult[2] = '4';
    }


    this.ds_package.setColumn(0, "GUBUN", vResult[2]);

    // 20240611 계약 패키지마스타 단가 수정 제한 여부 로직 추가 -- 시작
    var vsql = "SELECT NVL(B.DANGA_LIMITYN, 'N') AS DANGA_LIMITYN FROM ESTIMATE_HEAD A, PKGMST B WHERE A.ESTNO = '" + vEstno + "' AND A.PKGNO = B.PKGNO(+) ";

    var vRtn1 = this.gf_SelectSql_sync("ds_temp:" + vsql, "SELECT_PKGDAN_LIMIT", "ff_Callback_sync", 0);
    if (vi_ErrorCode < 0) return false;
    if (this.ds_temp.getColumn(0, "DANGA_LIMITYN") == 'Y') {
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "ORDER_PRC"), 'edittype', 'none');
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "DANGBN"), 'edittype', 'none');
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "AMTGU"), 'edittype', 'none');
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "SOBI_CHK"), 'edittype', 'none');
    } else {
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "ORDER_PRC"), 'edittype', "expr:SUJU_STS == '4' ||  INVOICE_QTY > 0 || PICK_QTY > 0 ? 'none' :'masknumber'");
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "DANGBN"), 'edittype', "expr:DANGBN == '4' ? 'none' : 'combo'");
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "AMTGU"), 'edittype', "expr:SUJU_STS == '4' ||  INVOICE_QTY > 0 || PICK_QTY > 0 ? 'none' :'combo'");
        this.gd_detail.setCellProperty("body", this.gd_detail.getBindCellIndex("body", "SOBI_CHK"), 'edittype', 'checkbox');

    }
    // 20240611 계약 패키지마스타 단가 수정 제한 여부 로직 추가 -- 끝

    if (this.ds_package.getColumn(0, "CON_SPC_GBN") == '2' &&
        this.ds_package.getColumn(0, "CONDAT") >= "20160101") {
        // this.btnCntr.style.visibility = "visible";
        // this.btnExp.style.visibility = "hidden";

        this.Div_detail.btn_detail_delete.set_enable(false);
        this.Div_detail.btn_detail_add.set_enable(false);
    } else {
        // this.btnCntr.style.visibility = "hidden";
        // this.btnExp.style.visibility = "visible";
        this.Div_detail.btn_detail_delete.set_enable(true);
        this.Div_detail.btn_detail_add.set_enable(true);
    }

    return;
}


this.ff_Danga_Full = function () {

    if (this.ds_detail.rowcount > 0) {
        alert("단가는 일괄 재계산 됩니다..\n약간의 시간이 소요됩니다.");
        for (i = 0; i <= this.ds_detail.rowcount - 1; i++) {
            this.ff_Danga(this.ds_detail.getColumn(i, "ITNBR"), i, 'KRW', 'Auto');
        }
    }
}


this.ff_Pkgchk = function () {
    if (this.ds_package.getColumn(0, "GUBUN") == '2') {
        if (this.ds_package.getColumn(0, "TOTAL_JAN_ORD") < 0) {
            alert("주문 포함 사용잔액이 없습니다\n계약을 다시 선택하거나 소비자가로 적용하세요..")
            this.ds_package.clearData();
            this.ds_package.insertRow(0);
            this.gsi_dataset_zero_set(this.ds_package, 0, "GUBUN^3");
            this.ds_package.setColumn(0, "GUBUN", '3');
            this.ds_package.setColumn(0, "ESTNO", null);
        }
    }
}
//--------------------------------------------------------------------
//// 주문 및 입출고 이력
//--------------------------------------------------------------------
this.ff_History = function (vCvcod) {
    this.ds_history.clearData();

    var vSdate = '.';
    var vEdate = '.';

    var vRtn = this.gf_SelectSql_sync("ds_temp: SELECT	MAX(EDATE)  FROM (SELECT MAX(ORDER_DATE)	AS EDATE 	FROM SORDER 	"
        + "          WHERE CVCOD = '" + vCvcod + "' AND CON_CVCOD 	LIKE '" + vCvcod + "' "
        + "         UNION	ALL "
        + "         SELECT  MAX(IO_DATE) FROM IMHIST_SAL WHERE CVCOD = '" + vCvcod + "' AND SALE_CVCOD 	LIKE '" + vCvcod + "' )", "SELECT_VNDDAMBO", "ff_Callback_sync", 0);

    if (!NXCore.isEmpty(vRtn[1]) && vRtn[1] != '') {
        var vResult = this.gf_SelectSql_sync("ds_temp:  SELECT TO_CHAR(TO_DATE('" + vRtn[1] + "', 'YYYYMMDD') - 7, 'YYYYMMDD') FROM DUAL"
            , "SELECT_FUN_GET_CVCOD_HISTORY", "ff_Callback_sync", 0);
    }

    var vArg = 'V06N00' + vCvcod + '^' + '%' + '^' + vResult[1] + '^' + vRtn[1] + '^' + 'Y' + '^' + '%' + '^';

    this.ds_head.setColumn(0, "ARG_DATA2", vArg);

    this.ff_Tran_sync("SELECT_HISTORY");

}


//--------------------------------------------------------------------
// 단품 출고 허용 한도 check 
//--------------------------------------------------------------------
this.ff_Danpum_Limit = function (vCvcod) {
    var nLimit = parseFloat(this.gf_Getsyscnfg('S', 18, 1));

    ///////////////////////////////////////////////////////////////////
    ///// 거래처별 특별 적용한도가 설정되어 있으면 우선 적용한다. /////    
    ///////////////////////////////////////////////////////////////////
    var vRtn = this.gf_SelectSql_sync("ds_temp: SELECT NVL(VALIDAMT, 0) FROM VNDDAMBO WHERE CVCOD = '" + vCvcod + "' AND SEQ = 1", "SELECT_VNDDAMBO", "ff_Callback_sync", 0);

    if (vi_ErrorCode < 0) return false;

    var nAmt = parseFloat(vRtn[1]);
    if (nAmt > 0)
        nLimit = nAmt;

    var vRtn = this.gf_SelectSql_sync("ds_temp: SELECT SAREA FROM VNDMST_SUB WHERE CVCOD = '" + vCvcod + "'", "SELECT_VNDMST_SUB", "ff_Callback_sync", 0);
    if (vi_ErrorCode < 0) return false;
    if (vRtn[1].substr(0, 2) == '01')
        nLimit = 99999999;

    var vRtn = this.gf_SelectSql_sync("ds_temp: SELECT NVL(SUM (A.IOAMT * B.CALVALUE), 0) AS AMT "
        + "  FROM IMHIST_SAL A, IOMATRIX B "
        + " WHERE A.CVCOD = '" + vCvcod + "' AND A.ESTNO IS NULL AND A.IOGBN = B.IOGBN "
        + "   AND B.TYPGBN IN ('1', '3') AND B.TRAGBN NOT IN ('8') AND DEPOT_NO NOT IN ('ZA161') AND CHECKNO IS NULL", "SELECT_IMHIST_SAL", "ff_Callback_sync", 0);
    if (vi_ErrorCode < 0) return false;
    var nAmt1 = parseFloat(vRtn[1]);

    var vRtn = this.gf_SelectSql_sync("ds_temp: SELECT NVL(SUM(A.ORDER_AMT), 0) AS ORDER_AMT "
        + "  FROM SORDER A, IOMATRIX B "
        + " WHERE A.CVCOD = '" + vCvcod + "' AND A.ESTNO IS NULL AND A.OUT_GU = B.IOGBN AND B.TYPGBN IN ('1', '3') "
        + "   AND B.TRAGBN NOT IN ('8') AND DEPOT_NO NOT IN ('ZA161') AND A.SUJU_STS NOT IN ('4','8') ", "SELECT_SORDER", "ff_Callback_sync", 0);
    if (vi_ErrorCode < 0) return false;
    var nAmt2 = parseFloat(vRtn[1]);

    if (nAmt1 + nAmt2 >= nLimit) {
        alert(" 현재 단품출고 금액이 허용 한도를 초과합니다.");

        ivChk = 0;
        this.btn_add_onclick();

        SetIem(this.ds_master, 1, "cvcod", null);
        return nAmt1 + nAmt2;
    }
    else
        return nAmt1 + nAmt2;
}


this.ff_Real_calc = function () {
    // 잔액을 실시간 표시

    if (this.ds_package.rowcount > 0 && this.ds_detail.rowcount > 0) {
        this.ds_package.setColumn(0, "RELCALC", parseFloat(this.ds_detail.getSum("ORDER_AMT") - this.ds_detail.getSum("OLD_ORDER_AMT")));
    }

    if (this.ds_package.rowcount == 0 && this.ds_detail.rowcount > 0) {
        this.ds_package.setColumn(0, "RELCALC", 0);
    }
}

//--------------------------------------------------------------------
//// 행Excel
//--------------------------------------------------------------------
this.ff_LeaseSet = function (vEstno) {
    var vSql, vRtn, vRtn2, vResult, vCalc_gbn, vCon_new_gbn, vCon_spc_gbn;
    var nUnderrate, nAhead_Yn, nInitamt, nLimitamt;

    vSql = "Select price_type from estimate_head_rmk where estno = '" + vEstno + "'";
    vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_estimate_head_rmk", "ff_Callback_sync", 0);
    if (vi_ErrorCode < 0) return false;
    this.ds_package.setColumn(0, "PRICE_TYPE", vRtn[1]);

    vSql = "select a.sugum_no, nvl(a.ipgum_amt, 0), nvl(a.paymonth, 0), nvl(a.ipgum_type, '.'), "
        + "              nvl(a.acct_txday_seq, 0), b.first_sudat, b.ahead_yn, b.cancle_yn, "
        + "              nvl(trunc(months_between(sysdate, to_date(b.first_sudat, 'yyyymmdd') + 1), 0), 0) + 1, "
        + "              to_char(add_months(to_date(b.first_sudat, 'yyyymmdd'), to_number(paymonth) - 1), 'yyyymmdd'), "
        + "              round(decode(a.paymonth, 0, 0, nvl(a.ipgum_amt, 0) / nvl(a.paymonth, 1)), 0) "
        + "         from sugum a, sugum_add_info b "
        + "        where a.estno = '" + vEstno + "' "
        + "          and a.sugum_no = (select max(sugum_no) from sugum where estno = '" + vEstno + "' and ipgum_type in ('5', 'E'))"
        + "          and a.sugum_no = b.sugum_no and nvl(b.cancle_yn, '.') != 'Y'";
    vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_sugum", "ff_Callback_sync", 0);
    if (vi_ErrorCode < 0) return false;

    vSql = "select nvl(sum(ipgum_amt), 0) from sugum a, sugum_add_info b "
        + " where a.sugum_no = b.sugum_no  and a.estno = '" + vEstno + "'"
        + "   and a.ipgum_type in ('H', 'J') ";
    vRtn2 = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_sugum_add_info", "ff_Callback_sync", 0);
    if (vi_ErrorCode < 0) return false;
    this.ds_package.setColumn(0, "SUGUM_NO", vRtn[1]);
    this.ds_package.setColumn(0, "IPGUM_AMT", parseInt(vRtn[2]) + parseInt(vRtn2[1]));
    this.ds_package.setColumn(0, "PAYMONTH", vRtn[3]);
    this.ds_package.setColumn(0, "IPGUM_TYPE", vRtn[4]);
    this.ds_package.setColumn(0, "IPGUM_STATUS", vRtn[5]);
    this.ds_package.setColumn(0, "FIRST_SUDAT", vRtn[6]);
    this.ds_package.setColumn(0, "AHEAD_YN", vRtn[7]);
    this.ds_package.setColumn(0, "CANCLE_YN", vRtn[8]);
    this.ds_package.setColumn(0, "MONCNT", vRtn[9]);
    this.ds_package.setColumn(0, "MONEND", vRtn[10]);
    this.ds_package.setColumn(0, "MONAMT", vRtn[11]);

    //if (vRtn[4] != '5') return;
    //if (vRtn[8] == 'Y') return;

    vCon_spc_gbn = this.ds_package.getColumn(0, "CON_SPC_GBN");

    ////////////////////////////////////////////////////////////////////////
    ///// 2016.10.07 역구매가 아닌 계약도 초도 물량 출고 허용토록 수정한다.
    ///// 단, 제품 계약이 아니면 초도 물량 설정 없다.
    ////////////////////////////////////////////////////////////////////////
    if (vCon_spc_gbn != '1') {
        this.ds_package.setColumn(0, "INITAMT", 0);
        this.ds_package.setColumn(0, "LIMITAMT", this.ds_package.getColumn(0, "USE_SUGUM_AMOUNT"));
        return;
    }

    if (vRtn[7] == 'Y')
        nAhead_yn = 20;
    else nAhead_yn = 10;

    vCon_new_gbn = this.ds_package.getColumn(0, "CON_NEW_GBN");
    nUnderrate = this.ds_package.getColumn(0, "UNDERRATE");

    /////////////////////////////////////////////////////////////////////////
    ///// 신규계약이면 초도 물량을 제공하나 재계약인 경우는 제공하지 않는다.
    /////////////////////////////////////////////////////////////////////////
    if (vCon_new_gbn == '1') {
        nInitamt = this.gf_Getsyscnfg('S', 21, nAhead_yn + 1);
    } else {
        nInitamt = this.gf_Getsyscnfg('S', 21, nAhead_yn + 2);
    }

    nInitamt = nexacro.round(nInitamt * 10000 * (100 - nUnderrate) / 100, 0);
    this.ds_package.setColumn(0, "INITAMT", nInitamt);
    vCalc_gbn = this.gf_Getsyscnfg('S', 21, nAhead_yn + 3);

    /////////////////////////////////////////////////////////////////////////
    ///// vCalc_gbn = 1  수금액 범위 내에서 출고 가능하다.
    ///// vCalc_gbn = 2  DGB 입금액 범위 내에서 출고 가능하다.
    /////////////////////////////////////////////////////////////////////////
    if (vCalc_gbn == 1) {
        this.ds_package.setColumn(0, "LIMITAMT", this.ds_package.getColumn(0, "USE_SUGUM_AMOUNT"));
    } else {

        if (vRtn[7] != 'Y') {
            alert(" 보증 역구매가 아닌 자료를 처리하고 있습니다!");
            return;
        }

        var vToday = this.gf_today();

        /////////////////////////////////////////////////////////////////////////
        ///// 할부종료일이 이미 지났으면 수금액 만큼 출고 가능하다.
        /////////////////////////////////////////////////////////////////////////
        if (vRtn[10] < vToday) {
            this.ds_package.setColumn(0, "LIMITAMT", this.ds_package.getColumn(0, "USE_SUGUM_AMOUNT"));
        } else {
            /////////////////////////////////////////////////////////////////////////
            ///// 할부개월수가 경과월수 보다 작으면 수금액 만큼 출고 가능하다.
            ///// 아니면 역구매 입금액을 제외한 나머지 수금액 + (경과월수 * 월납입액)
            /////////////////////////////////////////////////////////////////////////

            if (parseInt(vRtn[3]) <= parseInt(vRtn[9])) {
                this.ds_package.setColumn(0, "LIMITAMT", this.ds_package.getColumn(0, "USE_SUGUM_AMOUNT"));
            } else {
                nLimitamt = 0;

                vEstno = this.ds_package.getColumn(0, "ESTNO");
                vSql = "select nvl(sum(a.ipgum_amt), 0) from sugum a, sugum_add_info b "
                    + " where a.estno = '" + vEstno + "' and a.sugum_no = b.sugum_no "
                    + "   and nvl(b.cancle_yn, '.') != 'Y' "
                    + "   and ((a.ipgum_type not in ('5', 'E')) "
                    + "    or  (a.ipgum_type in ('5', 'E') and b.ahead_yn = 'N' and a.acct_txday_seq <> 0))";
                vResult = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_sugum_add_info", "ff_Callback_sync", 0);
                if (vi_ErrorCode < 0) return false;

                nLimitamt = parseInt(vResult[1]);
                nLimitamt = nLimitamt + (parseInt(vRtn[9]) * parseInt(vRtn[11]));
                this.ds_package.setColumn(0, "LIMITAMT", nLimitamt);
            }
        }
    }

    return;
}

this.ff_BoxJego = function () {
    var vEstno = this.ds_master.getColumn(0, "ESTNO");
    var vSql = "select sum(out_amt - rtn_amt) from box_list a, box_dtl b "
        + " where a.estno = '" + vEstno + "' and a.box_ser = b.box_ser";
    var vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_reffpf_5A", "ff_Callback_sync", 0);
    if (vi_ErrorCode < 0) return false;

    return vRtn[1];
}

this.ff_Cntritem = function () {

    var vRtn, vOrder_no;
    var vOpenParam = new Array();

    vOpenParam[0] = "O";
    vOpenParam[1] = this.ds_package.getColumn(0, "ESTNO");
    vOpenParam[2] = ivChk;
    vOpenParam[3] = this.ds_package.getColumn(0, "AMOUNT");
    vOpenParam[4] = this.ds_package.getColumn(0, "CONDAT");
    vOpenParam[5] = this.ds_master.getColumn(0, "CVCOD");
    vOpenParam[6] = this.ds_master.getColumn(0, "CVNAS");
    vOpenParam[7] = this.ds_master.getColumn(0, "SAREA");

    vRtn = this.gf_SelectSql_sync("ds_temp: SELECT SAREANM FROM SAREA WHERE SAREA = '" + vOpenParam[7] + "'"
        , "SELECT_SAREA", "ff_Callback_sync", 0);
    if (vi_ErrorCode < 0) return false;

    vOpenParam[8] = this.ds_temp.getColumn(0, 0);
    vOpenParam[9] = this.ds_master.getColumn(0, "EMP_ID");
    vOpenParam[10] = this.ds_master.getColumn(0, "SALE_EMPNAME");

    vUptchk = 'N';

    if (ivChk == '1') {
        vOpenParam[11] = '.';
        vOpenParam[12] = 'U';
    } else {
        vOrder_no = this.ds_master.getColumn(0, "ORDER_NO");
        vOpenParam[11] = vOrder_no.substr(0, 12);
        vOpenParam[12] = 'I';
    }
    // pdh    추후 수정                      
    var vModResult = OpenModal("sm/pkg/sm_pkg_estimate_dtl_e.aspx?Title=캐드캠 계약 품목 선정", vOpenParam, 1300, 850);

    if (vUptchk == 'Y')
        return;

    if (vModResult && ivChk != '0') {
        var i, nRow, nQty, nPrc, nAmt;
        var nCnt = vModResult[0][0];

        for (i = this.ds_detail.rowcount; i >= 1; i--) {
            this.ds_detail.deleteRow(i);
        }

        for (i = 0; i < nCnt; i++) {

            nQty = vModResult[i][3];
            nPrc = vModResult[i][21];
            if (nQty == 0) continue;

            nRow = this.ds_detail.addRow();
            this.gsi_dataset_zero_set(this.ds_detail, nRow, fvs_default_detail);
            nAmt = nQty * nPrc;

            this.ds_detail.setColumn(nRow, "ITNBR", vModResult[i][19]);
            this.ds_detail.setColumn(nRow, "PRODNM", vModResult[i][13]);
            this.ds_detail.setColumn(nRow, "ITDSC", vModResult[i][14]);
            this.ds_detail.setColumn(nRow, "ISPEC", vModResult[i][15]);

            this.ds_detail.setColumn(nRow, "ORDER_QTY", nQty);
            this.ds_detail.setColumn(nRow, "ORDER_PRC", nPrc);
            this.ds_detail.setColumn(nRow, "ORDER_AMT", nAmt);
            this.ds_detail.setColumn(nRow, "DANGBN", '1');
            this.ds_detail.setColumn(nRow, "CUST_NAPGI", vToday);

            if (nPrc == 0)
                this.ds_detail.setColumn(nRow, "AMTGU", 'N');
            else this.ds_detail.setColumn(nRow, "AMTGU", 'Y');

            this.DwItemChange(this.ds_detail, nRow, "order_qty", nQty);
        }

        this.ff_Real_calc();
    }
}
this.ff_Vndwarn = function (vReturnSale, vDataset, vObj, vLine) {
    if (vReturnSale[5] == '8' || vReturnSale[5] == '9') {
        if (!application.confirm(" 해당 거래처는 폐(휴)업 거래처 입니다.\n 계산서 출고분 발행인 경우 폐업일자 이후 발행 불가합니다.\n"
            + " 계속 하시겠습니까?")) {
            return -1;
        }
        else {
            if (vDataset != "ds_head") {
                fvs_pswd_chk = "Y";

                var vModResult = this.gf_showPopup('PASSWORD_CHK', "co_popu::co_popu_input_f.xfdl", { width: 810, height: 500 },
                    {
                        Argument: "PASSWORD"  // 암호체크  
                    }, { modal: true, layered: true, autosize: false, callback: "ff_AfterPswd" });
            }
        }
    }
    else if (vReturnSale[5] == 'E') {
        this.alert(" 해당 거래처 사업자등록 번호를 확인하세요.");
    }

    return 1;
}

// 폐업 거래처 암호 확인 
this.ff_AfterPswd = function (strId, obj) {
    if (strId == "PASSWORD_CHK") {
        if (obj == "OK") {  // 팝업에서 암호 확인이 정상으로 처리 되었음 
            //this.ds_master.setColumn(this.ds_master.rowposition, "GWGBN", "Y");

            fvs_pswd_chk = "OK";
        }
    }
    else {
        return;
    }
}

this.ff_Allowchk = function (vGubun, vCvcod, vEstno) {

    var vCntrl_yn = this.gf_Getsyscnfg('S', 22, '01');
    var vCntrl_ymd = this.gf_Getsyscnfg('S', 22, '02');
    var vCntrl_stat = this.gf_Getsyscnfg('S', 22, '03');

    if (vGubun == '1') {
        var vSql = "select 'Y', allow_gbn, allow_yn, nvl(temp_allow_end, '29991231'), nvl(allow_amt, 999999999) "
            + "  from vndmst_allow_hist where cvcod = '" + vCvcod + "'"
            + "   and allow_date || allow_time = (select max(allow_date || allow_time) "
            + "                                     keep (dense_rank last order by allow_date, allow_time) "
            + "                                     from vndmst_allow_hist where cvcod = '" + vCvcod + "')";

        var vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_reffpf_5A", "ff_Callback_sync", 0);
        if (vi_ErrorCode < 0) return false;
        if (vRtn[1] == 'Y') {
            if (vRtn[2] == '1') {
                if (vRtn[3] == 'N') {
                    alert(" 해당 거래처는 출고금지 거래처로 출고 불가합니다..");
                    this.ds_master.setColumn(0, "CVCOD", null);
                    this.ds_master.setColumn(0, "ESTNO", null);

                    this.ds_package.clearData();
                    this.ds_package.insertRow(0);
                    this.gsi_dataset_zero_set(this.ds_package, 0, "GUBUN^3");

                    this.ds_master.SetActionCode(1);
                    this.ds_master.SelectText(1, 0);
                    return -1;
                }

                if (vRtn[3] == 'Y') {
                    if (vToday > vRtn[4] || this.ds_master.getColumn(0, "ORDER_DATE") > vRtn[4]) {
                        alert(" 해당 거래처는 출고에 대한 한시적 허용일자가 경과하여 출고 불가합니다.");
                        this.ds_master.setColumn(0, "CVCOD", null);
                        this.ds_master.setColumn(0, "ESTNO", null);

                        this.ds_package.clearData();
                        this.ds_package.insertRow(0);
                        this.gsi_dataset_zero_set(this.ds_package, 0, "GUBUN^3");

                        // pdh *conv* vDw.SetActionCode(1);
                        // pdh *conv* vDw.SelectText(1, 0);
                        return -1;
                    }
                }
            }

            ivVndamt = parseInt(vRtn[5]);
        } else
            ivVndamt = 0;
    }

    ivEstamt = 0;
    ivAllow = 'N';

    if (vGubun == '2') {
        if (vEstno != '%' && vEstno != '' && vEstno != null) {

            var vQry = "select 'Y', allow_gbn, allow_yn, NVL(temp_allow_end, '29991231'), NVL(allow_amt, 999999999) "
                + "  from vndmst_allow_hist where cvcod = '" + vCvcod + "' "
                + "   and ((allow_gbn = '1') or (allow_gbn = '2' and estno = '" + vEstno + "'))"
                + "   and allow_date || allow_time = (select max(allow_date || allow_time) "
                + "                                          keep (dense_rank last order by allow_date, allow_time) "
                + "                                     from vndmst_allow_hist where cvcod = '" + vCvcod + "' "
                + "                                      and ((allow_gbn = '1') or (allow_gbn = '2' and estno = '" + vEstno + "')))";

            var vRtn = this.gf_SelectSql_sync("ds_temp:" + vQry, "SELECT_reffpf_5A", "ff_Callback_sync", 0);
            if (vi_ErrorCode < 0) return false;
            if (vRtn[1] == 'Y') {
                if (vRtn[3] == 'N') {
                    alert(" 해당 계약은 출고 금지 상태입니다.");

                    //this.ds_master.setColumn(0, "CVCOD", null);
                    this.ds_master.setColumn(0, "ESTNO", null);

                    this.ds_package.clearData();
                    this.ds_package.insertRow(0);
                    this.gsi_dataset_zero_set(this.ds_package, 0, "GUBUN^3");
                    return -1;
                }
            }

            var vQry = "select 'Y', allow_gbn, allow_yn, NVL(temp_allow_end, '29991231'), NVL(allow_amt, 999999999) "
                + "  from vndmst_allow_hist where cvcod = '" + vCvcod + "' "
                + "   and (allow_gbn = '2' and estno = '" + vEstno + "')"
                + "   and allow_date || allow_time = (select max(allow_date || allow_time) "
                + "                                          keep (dense_rank last order by allow_date, allow_time) "
                + "                                     from vndmst_allow_hist where cvcod = '" + vCvcod + "' "
                + "                                      and (allow_gbn = '2' and estno = '" + vEstno + "'))";

            var vRtn = this.gf_SelectSql_sync("ds_temp:" + vQry, "SELECT_reffpf_5A", "ff_Callback_sync", 0);
            if (vi_ErrorCode < 0) return false;

            if (vRtn[1] == 'Y') {
                if (vRtn[3] == 'N') {
                    alert(" 해당 계약은 출고 금지 상태입니다.");

                    this.ds_master.setColumn(0, "CVCOD", null);
                    this.ds_master.setColumn(0, "ESTNO", null);

                    this.ds_package.clearData();
                    this.ds_package.insertRow(0);
                    this.gsi_dataset_zero_set(this.ds_package, 0, "GUBUN^3");
                    return -1;
                }

                if (vRtn[3] == 'Y') {
                    if (this.gf_today() > vRtn[4] || this.ds_master.getColumn(0, "ORDER_DATE") > vRtn[4]) {
                        alert(" 해당 계약은 한시적 출고 허용일자가 경과하여 주문 불가합니다.");

                        //this.ds_master.setColumn(0, "CVCOD", null);
                        this.ds_master.setColumn(0, "ESTNO", null);

                        this.ds_package.clearData();
                        this.ds_package.insertRow(0);
                        this.gsi_dataset_zero_set(this.ds_package, 0, "GUBUN^3");
                        return -1;
                    }
                    else {
                        ivAllow = 'Y';
                    }
                }

                ivEstamt = parseInt(vRtn[5]);

                /* var vSql2   = "select condat, eststs, tax_gbn4 from estimate_head where estno = '" + vEstno + "'";
                   var vResult = this.gf_SelectSql_sync("ds_temp:" + vSql2 , "SELECT_reffpf_5A", "ff_Callback_sync",0); 
                if (vi_ErrorCode < 0) return false;
                   
                       if (vCntrl_yn == 'Y') 
                       {
                	
                     if (vCntrl_ymd >= vResult[1]) 
                     {
                    	
                         if (vCntrl_stat.search(vResult[2]) > 1) 
                         {
                    	
                             if (vResult[3] != 'Y') 
                             {
                            	
                                 alert(" 해당 계약은 " + vCntrl_ymd + " 이전 계약으로 주문 불가합니다.");
                                 
                                 this.ds_master.setColumn(0, "ESTNO", null);
                                         this.ds_package.clearData();
                                         this.ds_package.insertRow(0);
                                         this.gsi_dataset_zero_set(this.ds_package,0, "GUBUN^3");
                                         vResult[2] = '3';
                
                                         alert("주문단가는 소비자가로 계산 적용됩니다(1)");
                                         this.ff_Danpum_Limit(vCvcod);    							 
                             }
                         }
                     }
                 }*/
            }
            else {

                var vSql2 = "select condat, eststs, tax_gbn4 from estimate_head where estno = '" + vEstno + "'";
                var vResult = this.gf_SelectSql_sync("ds_temp:" + vSql2, "SELECT_reffpf_5A", "ff_Callback_sync", 0);
                if (vi_ErrorCode < 0) return false;

                if (vCntrl_yn == 'Y') {

                    if (vCntrl_ymd >= vResult[1]) {

                        if (vCntrl_stat.search(vResult[2]) > 1) {

                            if (vResult[3] != 'Y') {

                                alert(" 해당 계약은 " + vCntrl_ymd + " 이전 계약으로 주문 불가합니다.");

                                this.ds_master.setColumn(0, "ESTNO", null);
                                this.ds_package.clearData();
                                this.ds_package.insertRow(0);
                                this.gsi_dataset_zero_set(this.ds_package, 0, "GUBUN^3");
                                vResult[2] = '3';

                                alert("주문단가는 소비자가로 계산 적용됩니다(1)");
                                this.ff_Danpum_Limit(vCvcod);
                            }
                        }
                    }
                }
            }
        }
    }

    return 1;
}

//  package 컬럼이 변경되었을경우 계산 한다. 
this.ds_package_oncolumnchanged = function (obj: Dataset, e: nexacro.DSColChangeEventInfo) {

    this.ff_package_calculate();
}

// PACKAGE 계산 수식 
this.ff_package_calculate = function () {
    this.ds_package.set_enableevent(false);

    var vi_temp;

    if (NXCore.isEmpty(this.ds_package.getColumn(0, "USE_BACK_CON_AMOUNT"))) {
        this.ds_package.setColumn(0, "USE_BACK_CON_AMOUNT", 0);
    }
    if (NXCore.isEmpty(this.ds_package.getColumn(0, "USE_BACK_SOBIJA_AMOUNT"))) {
        this.ds_package.setColumn(0, "USE_BACK_SOBIJA_AMOUNT", 0);
    }

    if (NXCore.isEmpty(this.ds_package.getColumn(0, "USE_CON_AMOUNT"))) {
        this.ds_package.setColumn(0, "USE_CON_AMOUNT", 0);
    }
    if (NXCore.isEmpty(this.ds_package.getColumn(0, "USE_SOBIJA_AMOUNT"))) {
        this.ds_package.setColumn(0, "USE_SOBIJA_AMOUNT", 0);
    }
    if (NXCore.isEmpty(this.ds_package.getColumn(0, "ORDAMT"))) {
        this.ds_package.setColumn(0, "ORDAMT", 0);
    }


    vi_temp = this.ds_package.getColumn(0, "CONAMT") - this.ds_package.getColumn(0, "USE_JEPUM_CON_AMOUNT")
        + this.ds_package.getColumn(0, "USE_JEPUM_CON_AMOUNT_BACK");

    this.ds_package.setColumn(0, 'COMPUTE_1', vi_temp);


    this.ds_package.setColumn(0, "TOT_BACK", this.ds_package.getColumn(0, "USE_BACK_CON_AMOUNT") +
        this.ds_package.getColumn(0, "USE_BACK_SOBIJA_AMOUNT"));

    this.ds_package.setColumn(0, "TOT_CHUL", this.ds_package.getColumn(0, "USE_CON_AMOUNT") +
        this.ds_package.getColumn(0, "USE_SOBIJA_AMOUNT"));


    vi_temp = this.ds_package.getColumn(0, "AMOUNT") - this.ds_package.getColumn(0, "TOT_CHUL")
        + this.ds_package.getColumn(0, "TOT_BACK") + this.ds_package.getColumn(0, "ORDAMT");

    this.ds_package.setColumn(0, "TOTAL_JAN", vi_temp);

    if (this.ds_package.getColumn(0, "AMOUNT") == 0)
        this.ds_package.setColumn(0, "COMPUTE_8", 0);
    else
        this.ds_package.setColumn(0, "COMPUTE_8", nexacro.round((vi_temp / this.ds_package.getColumn(0, "AMOUNT")) * 100, 2));


    this.ds_package.setColumn(0, "COMPUTE_14", this.ds_package.getColumn(0, "IWOL_AMT"));

    vi_temp = this.ds_package.getColumn(0, "AMOUNT") - this.ds_package.getColumn(0, "TOT_CHUL")
        + this.ds_package.getColumn(0, "TOT_BACK") - this.ds_package.getColumn(0, "RELCALC");


    if (this.ds_package.getColumn(0, "GUBUN") == '3') vi_temp = 0;

    this.ds_package.setColumn(0, "TOTAL_JAN_ORD", vi_temp);



    if (this.ds_package.getColumn(0, "AMOUNT") == 0)
        this.ds_package.setColumn(0, "COMPUTE_9", 0);
    else
        this.ds_package.setColumn(0, "COMPUTE_9", nexacro.round((vi_temp / this.ds_package.getColumn(0, "AMOUNT")) * 100, 2));



    this.ds_package.setColumn(0, "COMPUTE_15", this.ds_package.getColumn(0, "TOT_CHUL") -
        this.ds_package.getColumn(0, "TOT_BACK"));

    this.ds_package.setColumn(0, "COMPUTE_5", this.ds_package.getColumn(0, "AMOUNT") -
        this.ds_package.getColumn(0, "USE_SUGUM_AMOUNT") -
        this.ds_package.getColumn(0, "PRVAMT"));

    this.ds_package.setColumn(0, "COMPUTE_7", this.ds_package.getColumn(0, "AMOUNT") -
        this.ds_package.getColumn(0, "TOT_CHUL") +
        this.ds_package.getColumn(0, "TOT_BACK"));

    vi_temp = (this.ds_package.getColumn(0, "CONAMT") + this.ds_package.getColumn(0, "CONAMT_KIT_STD")
        + this.ds_package.getColumn(0, "CONAMT_COMM_MACHINE") + this.ds_package.getColumn(0, "CONAMT_COMM_SOMO"))
        - this.ds_package.getColumn(0, "USE_CON_AMOUNT") + this.ds_package.getColumn(0, "USE_BACK_CON_AMOUNT");
    this.ds_package.setColumn(0, "COMPUTE_6", vi_temp);

    vi_temp = this.ds_package.getColumn(0, "CONAMT_KIT_STD") - this.ds_package.getColumn(0, "USE_KIT_STD_CON_AMOUNT")
        + this.ds_package.getColumn(0, "USE_KIT_STD_CON_AMOUNT_BACK");
    this.ds_package.setColumn(0, "COMPUTE_2", vi_temp);

    vi_temp = this.ds_package.getColumn(0, "CONAMT_COMM_MACHINE") - this.ds_package.getColumn(0, "USE_COMM_MACH_CON_AMOUNT")
        + this.ds_package.getColumn(0, "USE_MACH_CON_AMOUNT_BACK");
    this.ds_package.setColumn(0, "COMPUTE_3", vi_temp);

    vi_temp = this.ds_package.getColumn(0, "CONAMT_COMM_SOMO") - this.ds_package.getColumn(0, "USE_COMM_SOMO_CON_AMOUNT")
        + this.ds_package.getColumn(0, "USE_SOMO_CON_AMOUNT_BACK");
    this.ds_package.setColumn(0, "COMPUTE_4", vi_temp);

    this.ds_package.setColumn(0, "COMPUTE_10", this.ds_package.getColumn(0, "UNDERRATE"));
    this.ds_package.setColumn(0, "COMPUTE_12", this.ds_package.getColumn(0, "COMM_UNDERRATE"));

    vi_temp = this.ds_package.getColumn(0, "AMOUNT") - this.ds_package.getColumn(0, "USE_SUGUM_AMOUNT")
        - this.ds_package.getColumn(0, "PRVAMT");
    this.ds_package.setColumn(0, "COMPUTE_11", vi_temp);

    vi_temp = this.ds_package.getColumn(0, "TOTAL_JAN_ORD")
    if (this.ds_package.getColumn(0, "AMOUNT") == 0)
        this.ds_package.setColumn(0, "COMPUTE_13", 0);
    else
        this.ds_package.setColumn(0, "COMPUTE_13", vi_temp / this.ds_package.getColumn(0, "AMOUNT"));

    this.ds_package.set_enableevent(true);
}

// SMS메시지
this.OnSms = function (vJpno) {
    if (this.ds_package.rowcount == 0) return;

    var vOpenParam = new Array();

    // 계약잔익이 10%이하이면 잔액메시지, 전체소진이면 종료메시지
    var vCvcod = this.ds_master.getColumn(0, "CVCOD");
    var vEstno = this.ds_package.getColumn(0, "ESTNO");
    if (vEstno == null || vEstno == '') return;

    var vRate = this.ds_package.getColumn(0, "COMPUTE_13");

    if (vRate > 0.1) {
        return;
    }
    else if (vRate <= 0) {
        vOpenParam[0] = '1';  // (0)잔액 10% 남은 시점, (1)잔액이 다 소진되는 시점
    }
    else {

        vOpenParam[0] = '0';
    }

    if (vOpenParam[0] == '0') {
        var vResult = this.gf_SelectSql_sync("ds_temp: SELECT NVL(COUNT(*),0) FROM SORDER_SMS WHERE CVCOD = '" + vCvcod + "' AND ESTNO = '" + vEstno + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
        if (vi_ErrorCode < 0) return false;
        if (vResult[1] != '0') return;
    }


    vOpenParam[1] = vJpno;
    vOpenParam[2] = parseFloat(this.ds_package.getColumn(0, "AMOUNT") - this.ds_package.getColumn(0, "TOT_CHUL") + this.ds_package.getColumn(0, "TOT_BACK") - this.ds_package.getColumn(0, "RELCALC"));
    vOpenParam[3] = vCvcod;

    var vResult = OpenModal("sm/send/sm_send_order_neo_e_msg.aspx?Title=메시지 전송&Auth=U&Type=E", vOpenParam, 500, 600);


    return;
}
//  거래처 찾기 
this.ff_co_popu_vndsale_f = function (strId, arg_parm) {
    var resultForm = this.gf_showPopup(strId, "co_popu::co_popu_vndsale_f.xfdl", { width: 600, height: 700 },
        {
            OpenRetv: 'Y',   // popup open 즉시 조회  
            MultSelect: 'N',   // MULTI LINE 선택
            Argument: arg_parm  // 조회조건 파라메터 
        }, { modal: true, layered: true, autosize: false, callback: "ff_AfterPopup" });

}
// 성명 찾기 
this.ff_co_popu_sawon_sale_f = function (strId, arg_parm) {
    var resultForm = this.gf_showPopup(strId, "co_popu::co_popu_sawon_f.xfdl", { width: 500, height: 500 },
        {
            OpenRetv: 'Y',   // popup open 즉시 조회  
            MultSelect: 'N',   // MULTI LINE 선택
            Argument: arg_parm // 조회조건 파라메터 
        }, { modal: true, layered: true, autosize: false, callback: "ff_AfterPopup" });

}
// 형번  찾기 
this.ff_co_popu_itemas_f_4 = function (strId, arg_parm) {
    var resultForm = this.gf_showPopup(strId, "co_popu::co_popu_itemas_f_4.xfdl", { width: 907, height: 500 },
        {
            OpenRetv: 'Y',   // popup open 즉시 조회  
            MultSelect: '',   // MULTI LINE 선택 (이 아규먼트는 POPUP 프로그램에서 ARG_PARA 의 8번째 방으로 대체 한다. 
            Argument: arg_parm
        }, { modal: true, layered: true, autosize: false, callback: "ff_AfterPopup" });

}

//  주소 찾기 
this.ff_hr_co_popu_addr_f = function (strId, arg_parm) {
    var resultForm = this.gf_showPopup(strId, "hr_co_popu::hr_co_popu_addr_f.xfdl", { width: 10, height: 10 },
        {
            OpenRetv: 'Y',   // popup open 즉시 조회  
            MultSelect: 'N',   // MULTI LINE 선택
            Argument: arg_parm
        }, { modal: true, layered: true, autosize: false, callback: "ff_AfterPopup" });
}

this.ff_AfterPopup_pgrm = function (strId, obj) {

    if (NXCore.isEmpty(obj)) return;          // () 이함수로 리턴 파라메터가 없을경우가 있기떄문

    var va_Data = this.gf_popup_data(obj);  // popup 에서 넘어온 data 를 array 로 받아온다.

    if (va_Data == false) {
        return;
    }

    switch (strId) {
        case "sm_send::sm_send_trans_e.xfdl":     // 이문장은 프로그램 주소및 프로그램 id일껏 
            for (var i = 0; i < va_Data.length; i++) {
                this.ds_trans.set_enableevent(false);
                //this.ds_trans.setColumn(0,'TRANS_GU',va_Data[i][13]);
                this.ds_trans.setColumn(0, 'TRANS_CVCOD', va_Data[i][1]);
                this.ds_trans.setColumn(0, 'TRANS_HUMAN', va_Data[i][6]);
                this.ds_trans.setColumn(0, 'TRANS_TELNO', va_Data[i][7]);
                this.ds_trans.setColumn(0, 'TRANS_ADDR', va_Data[i][4]);
                this.ds_trans.setColumn(0, 'TRANS_ADDR1', va_Data[i][5]);
                this.ds_trans.setColumn(0, 'CVNAS', va_Data[i][9]);
                this.ds_trans.setColumn(0, 'OWNAM', va_Data[i][8]);
                this.ds_trans.setColumn(0, 'POSNO', va_Data[i][3]);
                this.ds_trans.set_enableevent(true);
            }
            break;
    }
    return;
}

// 구성품 등록
this.ff_co_popu_itemaskit_f = function (strId, arg_parm) {
    var resultForm = this.gf_showPopup(strId, "co_popu::co_popu_itemaskit_f.xfdl", { width: 350, height: 450 },
        {
            OpenRetv: 'Y',   // popup open 즉시 조회  
            MultSelect: '',   // MULTI LINE 선택 (이 아규먼트는 POPUP 프로그램에서 ARG_PARA 의 8번째 방으로 대체 한다. 
            Argument: arg_parm
        }, { modal: true, layered: true, autosize: false, callback: "ff_AfterPopup" });

}



// pupup의 콜백함수 처리
this.ff_AfterPopup = function (strId, obj) {

    var va_Data = this.gf_popup_data(obj);  // popup 에서 넘어온 data 를 array 로 받아온다.

    var vi_row;
    switch (strId) {
        case "popup_object_posno":
            for (var i = 0; i < va_Data.length; i++) {
                this.ds_trans.set_enableevent(false);
                this.ds_trans.setColumn(0, 'POSNO', va_Data[i][0]);
                this.ds_trans.setColumn(0, 'TRANS_ADDR', va_Data[i][1]);
                this.ds_trans.setColumn(0, 'TRANS_ADDR1', va_Data[i][2]);
                this.ds_trans.set_enableevent(true);
            }
            break;

        case "estimate_popup":

            if (va_Data != false) {
                for (var i = 0; i < va_Data.length; i++) {

                    this.ds_master.setColumn(0, "ESTNO", va_Data[i][3]);

                    this.ff_Package_Reset(va_Data[i][4], va_Data[i][3]);
                    this.ff_LeaseSet(va_Data[i][3]);
                    this.ff_Danga_Full();

                    var vSql = "SELECT NVL(B.LIMIT_YN, 'N') AS LIMIT_YN, A.PKGNO FROM ESTIMATE_HEAD A, PKGMST B WHERE A.ESTNO = '" + this.ds_master.getColumn(0, "ESTNO") + "' AND A.PKGNO = B.PKGNO(+) ";
                    var vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_LIMIT_CHK", "ff_Callback_sync", 0);
                    if (vi_ErrorCode < 0) return false;

                    if (this.ds_temp.getColumn(0, "LIMIT_YN") == 'Y') {
                        var vPkgno = this.ds_temp.getColumn(0, "PKGNO");

                        for (var j = 0; j < this.ds_detail.rowcount; j++) {
                            var vSql = "SELECT COUNT(*) AS CNT FROM PKGDTL A WHERE A.PKGNO = '" + vPkgno + "' AND A.ITNBR = '" + this.ds_detail.getColumn(j, "ITNBR") + "' ";
                            var vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_LIMIT_ITEMAS_CHK", "ff_Callback_sync", 0);
                            if (vi_ErrorCode < 0) return false;

                            if (this.ds_temp.getColumn(0, "CNT") <= 0) {
                                this.gf_message_chk("521497", "계약번호 : " + this.ds_master.getColumn(0, "ESTNO"));
                                this.ds_detail.setColumn(j, "ITNBR", null);
                                this.ds_detail.setColumn(j, "PRODNM", null);
                                this.ds_detail.setColumn(j, "ITDSC", null);
                                this.ds_detail.setColumn(j, "ISPEC", null);
                                this.ds_detail.setColumn(j, "ORDER_PRC", 0);
                                this.ds_detail.setColumn(j, "ORDER_AMT", 0);
                                this.ds_detail.setColumn(j, "UNPRC", 0);
                                this.ds_detail.setColumn(j, "VATAMT", 0);
                                this.ds_detail.setColumn(j, "DANAMT", 0);
                                this.ff_Real_calc();

                            }
                        }
                    }
                    // 20240611_품목제한 여부 추가 - 끝

                }
            }
            else {
                var vs_cvcod = this.ds_master.getColumn(0, "CVCOD");
                this.ds_master.setColumn(0, "ESTNO", null);
                this.ds_package.clearData();
                this.ds_package.insertRow(0);
                this.gsi_dataset_zero_set(this.ds_package, 0, "GUBUN^3");
                //vResult[2] = '3';

                // 총 미수금액은 Setting
                var vArg = 'V06N0010^' + vs_cvcod + '^' + vs_cvcod + '^.^' + vToday.substr(0, 6) + '^' + vToday.substr(0, 6) + '^';
                var vIwrst = this.gf_SelectSql_sync("ds_temp: SELECT NVL(IWOL_CREDIT_AMT, 0) + NVL(MAECHUL_AMT, 0) + NVL(MAECHUL_VAT, 0) - NVL(SAVE_AMT, 0) FROM TABLE (PKG_SALE_COMM_004.PKG_SALE_COMM_004_SALEJAN('" + vArg + "') ) ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
                //var vIwrst  = this.gf_SelectSql_sync("ds_temp: SELECT NVL(IWOL_CREDIT_AMT, 0) + NVL(MAECHUL_AMT, 0) - NVL(SAVE_AMT, 0) FROM TABLE (PKG_SALE_COMM_004.PKG_SALE_COMM_004_SALEJAN('"+vArg+"') ) ", "SELECT_reffpf_5A", "ff_Callback_sync",0);
                if (vi_ErrorCode < 0) return false;

                this.ds_package.setColumn(0, "IWOL_AMT", vIwrst[1]);

                alert("주문단가는 소비자가로 계산 적용됩니다(3)");
                this.ff_Danpum_Limit(vs_cvcod);
            }

            break;

        case "popup_excel_upload":
            //this.ds_detail.set_enableevent(false);
            for (var i = 0; i < va_Data.length; i++) {

                if (i == this.ds_detail.rowposition) {
                    vn_Row = this.ds_detail.rowposition;

                }
                else {
                    vn_Row = this.ds_detail.addRow();
                }

                var vs_Sql = " SELECT PRODNM, "
                    + "        ITDSC,  "
                    + "        ISPEC,  "
                    + "        UNMSR,  "
                    + "        ITTYP,  "
                    + "        ITCLS   "
                    + " FROM ITEMAS    "
                    + " WHERE ITNBR = '" + va_Data[i][0] + "' "
                    + "   AND USEYN = '0'              ";


                this.gf_SelectSql_sync("ds_temp : " + vs_Sql, "WRKCTR_SELECT", "ff_Callback_sync");

                var vs_Prodnm = this.ds_temp.getColumn(0, "PRODNM");
                var vs_Itdsc = this.ds_temp.getColumn(0, "ITDSC");
                var vs_Ispec = this.ds_temp.getColumn(0, "ISPEC");
                var vs_Unmsr = this.ds_temp.getColumn(0, "UNMSR");
                var vs_Ittyp = this.ds_temp.getColumn(0, "ITTYP");
                var vs_Itcls = this.ds_temp.getColumn(0, "ITCLS");

                if (NXCore.isEmpty(vs_Prodnm) || vs_Prodnm == "") {
                    if (this.gf_message_chk("121967", "[" + va_Data[i][0] + "]") == 1) {
                        continue;
                    }
                    else {
                        return;
                    }
                }

                var vs_FindRow = this.ds_detail.findRowExpr("ITNBR == '" + va_Data[i][0] + "' ", 0, this.ds_detail.rowcount - 1);

                if (vs_FindRow != -1) {
                    if (this.gf_message_chk("121968", "[" + va_Data[i][0] + "]") == 1) {
                        continue;
                    }
                    else {
                        return;
                    }
                }

                if (va_Data[i][1] <= 0) {
                    if (this.gf_message_chk("121969", "[" + va_Data[i][0] + "]") == 1) {
                        continue;
                    }
                    else {
                        return;
                    }
                }

                if (vs_Ittyp == '1' && vs_Itcls == '9999001') {
                    alert("패키지 판매품목은 팩 판매등록에서만 사용가능합니다..");
                    continue;
                }

                // 20240611_품목제한 여부 추가 - 시작
                if (!NXCore.isEmpty(this.ds_master.getColumn(0, "ESTNO")) && this.ds_master.getColumn(0, "ESTNO") != '') {
                    var vSql = "SELECT NVL(B.LIMIT_YN, 'N') AS LIMIT_YN, A.PKGNO FROM ESTIMATE_HEAD A, PKGMST B WHERE A.ESTNO = '" + this.ds_master.getColumn(0, "ESTNO") + "' AND A.PKGNO = B.PKGNO ";
                    var vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_LIMIT_CHK", "ff_Callback_sync", 0);
                    if (vi_ErrorCode < 0) return false;

                    if (this.ds_temp.getColumn(0, "LIMIT_YN") == 'Y') {
                        var vPkgno = this.ds_temp.getColumn(0, "PKGNO");

                        var vSql = "SELECT COUNT(*) AS CNT FROM PKGDTL A WHERE A.PKGNO = '" + vPkgno + "' AND A.ITNBR = '" + va_Data[i][0] + "' ";
                        var vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_LIMIT_ITEMAS_CHK", "ff_Callback_sync", 0);
                        if (vi_ErrorCode < 0) return false;

                        if (this.ds_temp.getColumn(0, "CNT") <= 0) {
                            this.gf_message_chk("521497", "계약번호 : " + this.ds_master.getColumn(0, "ESTNO"));
                            continue;
                        }
                    }
                }
                // 20240611_품목제한 여부 추가 - 끝

                var vs_Sugugb = this.ds_master.getColumn(0, "SUGUGB");

                vs_Sql = "select RFNA2, RFNA3 from reffpf where rfcod = '5A' and rfgub = '" + vs_Sugugb + "' ";

                this.gf_SelectSql_sync("ds_temp : " + vs_Sql, "WRKCTR_SELECT", "ff_Callback_sync");

                this.ds_detail.setColumn(vn_Row, 'OUT_GU', this.ds_temp.getColumn(0, "RFNA3"));
                this.ds_detail.setColumn(vn_Row, 'CUST_NAPGI', vToday);
                this.ds_detail.setColumn(vn_Row, 'MISAYU', this.ds_master.getColumn(0, "MISAYU"));

                this.ds_detail.setColumn(vn_Row, 'ITNBR', va_Data[i][0]);
                this.ds_detail.setColumn(vn_Row, 'PRODNM', vs_Prodnm);
                this.ds_detail.setColumn(vn_Row, 'ITDSC', vs_Itdsc);
                this.ds_detail.setColumn(vn_Row, 'ISPEC', vs_Ispec);
                this.ds_detail.setColumn(vn_Row, 'ORDER_QTY', va_Data[i][1]);
                this.ds_detail.setColumn(vn_Row, 'ORDER_PSPEC', '.');
                this.ds_detail.setColumn(vn_Row, 'OVERSEA_GU', '1');
                this.ds_detail.setColumn(vn_Row, 'SUJU_STS', '1');
                this.ds_detail.setColumn(vn_Row, 'AMTGU', 'Y');
                this.ds_detail.setColumn(vn_Row, 'TUNCU', 'KRW');
                this.ds_detail.setColumn(vn_Row, 'RCV_GUBUN', '1');
                this.ds_detail.setColumn(vn_Row, 'CRT_PGMID', '1');
                this.ds_detail.setColumn(vn_Row, 'GWSTS', '00');

                this.ff_Real_calc();
            }
            //this.ds_detail.set_enableevent(true);
            break;

        case "popup_excel_upload2":
            this.ds_excel.clearData();

            var vs_Amtgu, vJunpyoseq, vJpno;
            var vCnt = 0;
            var vSumcnt = 0;
            var vNext_Cvcod;

            var vs_today = this.gf_today();


            vJunpyoseq = this.gf_get_junpyo(vs_today, "A1");

            vJpno = vs_today + vJunpyoseq;

            for (var i = 0; i < va_Data.length; i++) {

                if (i == this.ds_excel.rowposition) {
                    vn_Row = this.ds_excel.rowposition;

                }
                else {
                    vn_Row = this.ds_excel.addRow();
                }

                var vs_Sql = " SELECT PRODNM, "
                    + "        ITDSC,  "
                    + "        ISPEC,  "
                    + "        UNMSR,  "
                    + "        ITTYP,  "
                    + "        ITCLS   "
                    + " FROM ITEMAS    "
                    + " WHERE ITNBR = '" + va_Data[i][9] + "' "
                    + "   AND USEYN = '0'              ";


                this.gf_SelectSql_sync("ds_temp : " + vs_Sql, "WRKCTR_SELECT", "ff_Callback_sync");

                if (va_Data[i][1] != vNext_Cvcod) {
                    vJunpyoseq = this.gf_get_junpyo(vs_today, "A1");

                    vJpno = vs_today + vJunpyoseq;
                }
                vNext_Cvcod = va_Data[i][1];
                //alert(i);

                var vs_Prodnm = this.ds_temp.getColumn(0, "PRODNM");
                var vs_Itdsc = this.ds_temp.getColumn(0, "ITDSC");
                var vs_Ispec = this.ds_temp.getColumn(0, "ISPEC");
                var vs_Unmsr = this.ds_temp.getColumn(0, "UNMSR");
                var vs_Ittyp = this.ds_temp.getColumn(0, "ITTYP");
                var vs_Itcls = this.ds_temp.getColumn(0, "ITCLS");

                if (NXCore.isEmpty(vs_Prodnm) || vs_Prodnm == "") {
                    if (this.gf_message_chk("121967", "[" + va_Data[i][9] + "]") == 1) {
                        continue;
                    }
                    else {
                        return;
                    }
                }

                var vs_FindRow = this.ds_excel.findRowExpr("ITNBR == '" + va_Data[i][9] + "' && CVCOD == '" + va_Data[i][1] + "' && ORDER_DATE = '" + vs_today + "' ", 0, this.ds_excel.rowcount - 1);

                if (vs_FindRow != -1) {
                    if (this.gf_message_chk("121968", "[" + va_Data[i][9] + "]") == 1) {
                        continue;
                    }
                    else {
                        return;
                    }
                }

                if (va_Data[i][10] <= 0) {
                    if (this.gf_message_chk("121969", "[" + va_Data[i][9] + "]") == 1) {
                        continue;
                    }
                    else {
                        return;
                    }
                }

                if (vs_Ittyp == '1' && vs_Itcls == '9999001') {
                    alert("패키지 판매품목은 팩 판매등록에서만 사용가능합니다..");
                    continue;
                }

                ///택배사 코드 확인
                var vs_trans_cgbn = va_Data[i][14];
                if (vs_trans_cgbn == '한진') {
                    vs_trans_cgbn = 'H01';
                } else if (vs_trans_cgbn == '일양') {
                    vs_trans_cgbn = 'T01';
                } else {
                    alert("택배사 입력이 잘못되었습니다. [" + va_Data[i][14] + "]");
                    return;
                }

                var vs_Sugugb = va_Data[i][13];

                if (vs_Sugugb == '유상') {
                    vs_Sugugb = 'O02';
                    vs_Amtgu = 'Y';
                }
                else {
                    vs_Sugugb = 'O18';
                    vs_Amtgu = 'N';
                }

                this.gsi_dataset_zero_set(this.ds_excel, vn_Row, fvs_default_detail);

                if (vn_Row > 999) {
                    vJpno = vJpno + 1;
                }



                var vs_Sql2 = " SELECT CVPLN, "
                    + "        SALE_EMP  "
                    + " FROM VNDMST_SUB    "
                    + " WHERE CVCOD = '" + va_Data[i][1] + "' ";


                this.gf_SelectSql_sync("ds_temp : " + vs_Sql2, "WRKCTR_SELECT", "ff_Callback_sync");

                if (NXCore.isEmpty(va_Data[i][15]) || va_Data[i][15] == '') {

                    var vCvpln = this.ds_temp.getColumn(0, "CVPLN");
                    var vSale_emp = this.ds_temp.getColumn(0, "SALE_EMP");
                }
                else {
                    var vCvpln = va_Data[i][15];
                    var vSale_emp = this.ds_temp.getColumn(0, "SALE_EMP");
                }

                var vs_Sql3 = this.gf_SelectSql_sync("ds_temp: select cvcod from estimate_head where estno = '" + vCvpln + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

                if (va_Data[i][1] != vs_Sql3[1]) {
                    alert('주문거래처' + '(' + va_Data[i][1] + ')' + '와 계약거래처' + '(' + vs_Sql3[1] + ')' + '가 다릅니다. 거래처정보에 쇼핑몰계약번호를 확인하세요');
                    return;
                }

                this.ds_excel.setColumn(vn_Row, 'ORDER_NO', vJpno + this.gf_NumToStr(vn_Row + 1, 3));

                this.ds_excel.setColumn(vn_Row, 'OUT_GU', vs_Sugugb);
                this.ds_excel.setColumn(vn_Row, 'CUST_NAPGI', va_Data[i][0]);
                this.ds_excel.setColumn(vn_Row, 'MISAYU', 'N');

                this.ds_excel.setColumn(vn_Row, 'ITNBR', va_Data[i][9]);
                this.ds_excel.setColumn(vn_Row, 'PRODNM', vs_Prodnm);
                this.ds_excel.setColumn(vn_Row, 'ITDSC', vs_Itdsc);
                this.ds_excel.setColumn(vn_Row, 'ISPEC', vs_Ispec);
                this.ds_excel.setColumn(vn_Row, 'ORDER_QTY', va_Data[i][10]);
                this.ds_excel.setColumn(vn_Row, 'ORDER_PSPEC', '.');
                this.ds_excel.setColumn(vn_Row, 'OVERSEA_GU', '1');
                this.ds_excel.setColumn(vn_Row, 'SUJU_STS', '1');
                this.ds_excel.setColumn(vn_Row, 'AMTGU', 'Y');
                this.ds_excel.setColumn(vn_Row, 'TUNCU', 'KRW');
                this.ds_excel.setColumn(vn_Row, 'RCV_GUBUN', '1');
                this.ds_excel.setColumn(vn_Row, 'CRT_PGMID', '1');
                this.ds_excel.setColumn(vn_Row, 'GWSTS', '00');

                this.ds_excel.setColumn(vn_Row, 'ORDER_DATE', va_Data[i][0]);

                this.ds_excel.setColumn(vn_Row, 'ESTNO', vCvpln);

                this.ds_excel.setColumn(vn_Row, 'CVCOD', va_Data[i][1]);
                this.ds_excel.setColumn(vn_Row, 'ORDER_PRC', va_Data[i][11]);
                this.ds_excel.setColumn(vn_Row, 'ORDER_AMT', va_Data[i][10] * va_Data[i][11]);
                this.ds_excel.setColumn(vn_Row, 'DANGBN', '3');
                this.ds_excel.setColumn(vn_Row, 'AMTGU', vs_Amtgu);
                this.ds_excel.setColumn(vn_Row, 'DEPOT_NO', 'ZA191');
                this.ds_excel.setColumn(vn_Row, 'CON_CVCOD', va_Data[i][3]);
                this.ds_excel.setColumn(vn_Row, 'DEPTNO', va_Data[i][2]);
                this.ds_excel.setColumn(vn_Row, 'SUGUGB', '1');
                this.ds_excel.setColumn(vn_Row, 'EMP_ID', vSale_emp);
                this.ds_excel.setColumn(vn_Row, 'POSNO', va_Data[i][4]);
                this.ds_excel.setColumn(vn_Row, 'ADDR1', va_Data[i][5]);
                this.ds_excel.setColumn(vn_Row, 'ADDR2', va_Data[i][6]);
                this.ds_excel.setColumn(vn_Row, 'HUMAN', va_Data[i][7]);
                this.ds_excel.setColumn(vn_Row, 'TELNO', va_Data[i][8]);
                this.ds_excel.setColumn(vn_Row, 'AGRDAT', vs_trans_cgbn);

            }
            this.ff_Tran_sync("SAVE_EXCEL");
            break;

        case "co_popu_itnbr_detail":
        case "co_popu_itnbr_detail_rbtn":
            trace("co_popu_itnbr_detail_rbtn");
            vDw = this.ds_detail;
            vRow = this.ds_detail.rowposition;
            if (va_Data == false) {
                return;
            }


            var vSugugb = this.ds_master.getColumn(0, "SUGUGB");

            // 수불구분은 수주구분에 의해 처리
            var vIogbn = this.gf_SelectSql_sync("ds_temp: select rfna2, rfna3 from reffpf where rfcod = '5A' and rfgub = '" + vSugugb + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
            if (vi_ErrorCode < 0) return false;
            var vDept = this.ds_master.getColumn(0, "DEPOT_NO");
            var vStkchk = this.gf_Getsyscnfg('S', 17, 1);
            var vi_rbtn_init = 0;
            for (var i = 0; i < va_Data.length; i++) {
                var nFindRow = vDw.findRow("ITNBR", va_Data[i][2]);
                if (nFindRow >= 0 && nFindRow != vRow) {
                    if (!application.confirm(nFindRow + "행에 " + va_Data[i][4] + " " + va_Data[i][5] + " 에 이미 동일한 형번이 있습니다..\n추가하시겠습니까?")) {
                        continue;
                    }
                }
                trace(va_Data[i][10]);
                if (va_Data[i][10] != '0') {
                    alert(va_Data[i][2] + " 사용할 수 없는 품목입니다.");
                    continue;
                }

                if (va_Data[i][17] == '1' && va_Data[i][18] == '9999001') {
                    alert("패키지 판매품목은 팩 판매등록에서만 사용가능합니다..");

                    if (i == 0 && vDw.rowposition >= 0) {
                        vDw.set_enableevent(false);
                        vDw.setColumn(vDw.rowposition, "ITNBR", null);
                        vDw.setColumn(vDw.rowposition, "PRODNM", null);
                        vDw.setColumn(vDw.rowposition, "ITDSC", null);
                        vDw.setColumn(vDw.rowposition, "ISPEC", null);
                        vDw.set_enableevent(true);
                    }

                    continue;
                }

                if (vRgn_yn == 'N') {
                    var vItnbr = va_Data[i][2];
                    var vRtn = this.gf_SelectSql_sync("ds_temp: Select count(*) from reffpf where rfcod = '5S' and rfna1 = '" + vItnbr + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
                    var vCvcod = this.ds_master.getColumn(0, "CVCOD");

                    if ((parseInt(vRtn[1]) > 0) && (vCvcod != '69196')) {
                        alert(" 동종골 회수율이 미달되어 동종골 주문 불가합니다.");

                        if (vRgn_Ctdate <= vToday) {
                            vDw.setColumn(vDw.rowposition, "ITNBR", null);
                            vDw.setColumn(vDw.rowposition, "PRODNM", null);
                            vDw.setColumn(vDw.rowposition, "ITDSC", null);
                            vDw.setColumn(vDw.rowposition, "ISPEC", null);
                            return;
                        }
                    }
                }

                var vSql = "SELECT A.NEWITS, B.JEGO_QTY, C.BLK_YN, C.BLK_ONLY, D.ITTYP, D.ITCLS FROM ITEMAS_MRP A, STOCK B, ITEMAS_ADD_INFO C, ITEMAS D "
                    + " WHERE A.ITNBR = '" + va_Data[i][2] + "' AND A.ITNBR = B.ITNBR(+) "
                    + "   AND B.DEPOT_NO(+) = '" + vDept + "' AND A.ITNBR = C.ITNBR(+) AND A.ITNBR = D.ITNBR";

                var vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_reffpf_5A", "ff_Callback_sync", 0);
                if (vi_ErrorCode < 0) {
                    return false;
                }
                trace(vDept);
                if (vDept == 'ZS010' || vDept == 'ZS094') {

                    var vCon_spc_gbn = this.ds_package.getColumn(0, "CON_SPC_GBN");

                    if (vRtn[5] == '1' && vRtn[6].substr(0, 4) == '0703') {
                        if (vCon_spc_gbn != '1' && vCon_spc_gbn != 'B' && vCon_spc_gbn != '5' && vCon_spc_gbn != '11') {
                            alert(va_Data[i][2] + " 제품 PAC 혹은 GUIDE PAC 으로만 주문 가능한 품목입니다.");
                            vDw.set_enableevent(false);
                            vDw.setColumn(vRow, "ITNBR", null);
                            // pdh *conv* vDw.SetActionCode(1);
                            // pdh *conv* vDw.SelectText ( 1, 0 );
                            vDw.set_enableevent(true);
                            return;
                        }
                    }

                    /*					if (vCon_spc_gbn == 'B') {
                                            if (vRtn[5] != '1' || (vRtn[5] == '1' && (vRtn[6].substr(0, 4) > '0299' && vRtn[6].substr(0, 4) != '0703'))) {
                                                alert(va_Data[i][2] + " GUIDE PAC.. 으로 주문 불가한 품목입니다.");
                                                vDw.set_enableevent(false);
                                                vDw.setColumn( vRow, "ITNBR", null);
                                                // pdh *conv* vDw.SetActionCode(1);
                                                // pdh *conv* vDw.SelectText ( 1, 0 );
                                                vDw.set_enableevent(true);
                                                return;
                                            }
                                        }									*/

                    if (vRtn[1] != 'Y' || vRtn[2] < 1) {
                        var vRet = this.gf_SelectSql_sync("ds_temp: SELECT JUMAECHUL  "
                            + " FROM vndmst_stock   "
                            + " WHERE cvcod  = '" + vDept + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
                        if (vRet[1] != '4') {
                            if (vRtn[1] == 'N') {
                                vDw.set_enableevent(false);
                                vDw.setColumn(vDw.rowposition, "ITNBR", null);
                                vDw.set_enableevent(true);
                                alert(va_Data[i][2] + " 주문 불가한 품목입니다..");
                                continue;
                            }
                            else
                                if (vRtn[1] == 'O') {
                                    var vOrdate = this.ds_master.getColumn(0, "ORDER_DATE");
                                    var vSysdate = this.gf_today();

                                    if (vOrdate <= vSysdate) {
                                        vDw.set_enableevent(false);
                                        vDw.setColumn(vDw.rowposition, "ITNBR", null);
                                        vDw.set_enableevent(true);
                                        alert(va_Data[i][2] + " 제한적 주문 품목입니다.");
                                        continue;
                                    }
                                }
                                else
                                    if (vStkchk == 'Y') {
                                        vDw.set_enableevent(false);
                                        vDw.setColumn(vDw.rowposition, "ITNBR", null);
                                        vDw.set_enableevent(true);
                                        alert(va_Data[i][2] + " 재고 없는 품목입니다.");
                                        continue;
                                    }
                        }
                    }
                }

                if (this.ds_master.getColumn(0, "ESTNO") != '' && this.ds_master.getColumn(0, "ESTNO") != null) {
                    if (this.ds_package.getColumn(0, "CON_SPC_GBN") == '5') {
                        if (vRtn[3] != 'Y') {
                            vDw.set_enableevent(false);
                            vDw.setColumn(vDw.rowposition, "ITNBR", null);
                            vDw.set_enableevent(true);
                            alert(va_Data[1][2] + " 블럭 계약으로 주문 불가 품목입니다...");
                            // pdh *conv* vDw.SetActionCode(1);
                            // pdh *conv* vDw.SelectText ( 1, 0 );
                            continue;
                        }
                    } else {
                        if (vRtn[4] == 'Y') {
                            vDw.set_enableevent(false);
                            vDw.setColumn(vDw.rowposition, "ITNBR", null);
                            vDw.set_enableevent(true);
                            alert(va_Data[1][2] + " 블럭 계약만 주문 가능한 품목입니다...");
                            // pdh *conv* vDw.SetActionCode(1);
                            // pdh *conv* vDw.SelectText ( 1, 0 );
                            continue;
                        }
                    }
                }

                var vInsrow;
                // 				if (i == 0 && vDw.rowposition >= 0 )
                // 				{
                // 					vInsrow = vDw.rowposition;
                // 				}
                // 				else
                // 				{
                // 					vInsrow = this.ds_detail.addRow();
                // 					this.gsi_dataset_zero_set(this.ds_detail, vInsrow, this.fvs_default_detail);
                // 				}
                vInsrow = vDw.rowposition;
                vi_rbtn_init = vi_rbtn_init + 1;
                if (vi_rbtn_init == 1) { }
                else {
                    vInsrow = this.ds_detail.addRow();
                    this.gsi_dataset_zero_set(this.ds_detail, vInsrow, fvs_default_detail);
                }


                vDw.set_enableevent(false);
                vDw.setColumn(vInsrow, "ITNBR", va_Data[i][2]);
                vDw.setColumn(vInsrow, "PRODNM", va_Data[i][3]);
                vDw.setColumn(vInsrow, "ITDSC", va_Data[i][4]);
                vDw.setColumn(vInsrow, "ISPEC", va_Data[i][5]);

                // 20240611_품목제한 여부 추가 - 시작
                if (!NXCore.isEmpty(this.ds_master.getColumn(0, "ESTNO")) && this.ds_master.getColumn(0, "ESTNO") != '') {
                    var vSql = "SELECT NVL(B.LIMIT_YN, 'N') AS LIMIT_YN, A.PKGNO FROM ESTIMATE_HEAD A, PKGMST B WHERE A.ESTNO = '" + this.ds_master.getColumn(0, "ESTNO") + "' AND A.PKGNO = B.PKGNO ";
                    var vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_LIMIT_CHK", "ff_Callback_sync", 0);
                    if (vi_ErrorCode < 0) return false;

                    if (this.ds_temp.getColumn(0, "LIMIT_YN") == 'Y') {
                        var vPkgno = this.ds_temp.getColumn(0, "PKGNO");

                        var vSql = "SELECT COUNT(*) AS CNT FROM PKGDTL A WHERE A.PKGNO = '" + vPkgno + "' AND A.ITNBR = '" + va_Data[i][2] + "' ";
                        var vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_LIMIT_ITEMAS_CHK", "ff_Callback_sync", 0);
                        if (vi_ErrorCode < 0) return false;

                        if (this.ds_temp.getColumn(0, "CNT") <= 0) {
                            this.gf_message_chk("521497", "계약번호 : " + this.ds_master.getColumn(0, "ESTNO"));
                            vDw.set_enableevent(false);
                            vDw.setColumn(vDw.rowposition, "ITNBR", null);
                            vDw.setColumn(vDw.rowposition, "PRODNM", null);
                            vDw.setColumn(vDw.rowposition, "ITDSC", null);
                            vDw.setColumn(vDw.rowposition, "ISPEC", null);
                            vDw.set_enableevent(true);
                            return;
                        }
                    }
                }
                // 20240611_품목제한 여부 추가 - 끝

                var vSql = "Select fct_gbn, ins_claim_yn From ITEMAS_ADD_INFO Where ITNBR = '" + va_Data[i][2] + "'";
                //var vSql = "Select facgbn From ITEMAS_MRP Where ITNBR = '" + va_Data[i][2] +"'";
                var vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_reffpf_5A", "ff_Callback_sync", 0);
                if (vi_ErrorCode < 0) {
                    return false;
                }
                vDw.setColumn(vInsrow, "FACGBN", vRtn[1]);
                vDw.setColumn(vInsrow, "INS_CLAIM_YN", vRtn[2]);

                vDw.setColumn(vInsrow, "CUST_NAPGI", vToday);
                vDw.setColumn(vInsrow, "OUT_GU", vIogbn[2]);
                vDw.set_enableevent(true);

                this.ff_Danga(va_Data[i][2], vInsrow, 'KRW', 'Auto');

                // pdh *conv* vDw.SetActionCode(1);
                // pdh *conv* vDw.SelectText ( 1, 0 );

                var vs_cnt = this.gf_SelectSql_sync("ds_temp: Select count(*) from itemas_mrp where itnbr = '" + va_Data[i][2] + "' and containgu = 'Y'  ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

                if (vs_cnt[1] > 0) {
                    this.ff_co_popu_itemaskit_f("co_popu_itnkit", va_Data[i][2]);
                }

            }

            break;
        case "popup_ed_TRANS_CVCOD_trasn":
        case "popup_ed_TRANS_SAREA_trasn":    // 이 값은 안들어옴. 
            vDw = this.ds_trans;
            vRow = this.ds_trans.rowposition;
            vDw.set_enableevent(false);
            if (va_Data == false) {
                vDw.setColumn(vRow, "TRANS_CVCOD", null);
                vDw.setColumn(vRow, "CVNAS", null);
                vDw.setColumn(vRow, "OWNAM", null);
                vDw.setColumn(vRow, "TRANS_HUMAN", null);
                vDw.setColumn(vRow, "TRANS_TELNO", null);
                vDw.setColumn(vRow, "TRANS_ADDR", null);
                vDw.setColumn(vRow, "TRANS_ADDR1", null);
                this.ds_trans.set_enableevent(true);
                return;
            }
            if (this.ff_Vndwarn(va_Data[0], "ds_trans", "TRANS_CVCOD", "4704") == -1) {
                this.ds_trans.set_enableevent(true);
                return;
            }
            var vSql;
            if (strId == "popup_ed_TRANS_CVCOD_trasn") {
                var vSql = "Select cvnas2, ownam, cvpln, decode(Nvl(telno1, ''), '', null, telno1||'-'||telno2||'-'||telno3), "
                    + "       addr1||nvl(addr2, ' '), cvstatus, posno          "
                    + "  From vndmst where cvcod = '" + va_Data[0][0] + "' ";
            } else {
                var vSql = "Select a.cvnas2, a.ownam, a.cvpln, decode(Nvl(b.telno, ''), '', null, b.telno), "
                    + "       b.addr1||nvl(b.addr2, ' '), a.cvstatus, b.posno          "
                    + "  From vndmst a, sarea_addr b, sarea c where a.cvcod = '" + va_Data[0][0] + "' and a.cvcod = c.deptcode and c.sarea = b.cvcod";
            }

            var vResult = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_vndmst", "ff_Callback_sync", 0);
            if (vi_ErrorCode < 0) {
                this.ds_trans.set_enableevent(true);
                return false;
            }
            vDw.setColumn(vRow, "TRANS_CVCOD", va_Data[0][0]);
            vDw.setColumn(vRow, "CVNAS", vResult[1]);
            vDw.setColumn(vRow, "OWNAM", vResult[2]);
            vDw.setColumn(vRow, "TRANS_HUMAN", vResult[3]);
            vDw.setColumn(vRow, "TRANS_TELNO", vResult[4]);
            vDw.setColumn(vRow, "TRANS_ADDR", vResult[5]);
            vDw.setColumn(vRow, "POSNO", vResult[7]);

            vDw.setColumn(vRow, "TRANS_ADDR1", null);
            this.ds_trans.set_enableevent(true);
            break;
        case "popup_ed_POSNO_trasn":
            if (va_Data == false) {
                this.ds_trans.set_enableevent(false);
                this.Div_content.msk_trans_posno.set_value("");
                this.Div_content.ed_trans_addr.set_value("");
                this.Div_content.ed_trans_addr1.set_value("");
                this.ds_trans.set_enableevent(true);
                return;
            }

            this.ds_trans.set_enableevent(false);

            this.Div_content.msk_trans_posno.set_value(va_Data[0][0]);
            this.Div_content.ed_trans_addr.set_value(va_Data[0][1]);
            this.Div_content.ed_trans_addr1.set_value("");
            this.ds_trans.set_enableevent(true);
            break;

        case "popup_ed_OWNAM_master":
        case "popup_ed_CVCOD_master":
            if (va_Data == false) {
                this.ds_master.set_enableevent(false);
                this.ff_Package_Reset('NONE', '%');
                this.ff_Pkgchk();

                alert("거래처가 없거나 지금 현재 거래중인 고객이 아닙니다.");
                this.ds_master.setColumn(this.ds_master.rowposition, "CVCOD", null);
                this.ds_master.setColumn(this.ds_master.rowposition, "CVNAS", null);
                this.ds_master.setColumn(this.ds_master.rowposition, "OWNAM", null);
                this.ds_master.setColumn(this.ds_master.rowposition, "ESTNO", null);

                this.ds_package.clearData();
                this.ds_package.insertRow(0);
                this.gsi_dataset_zero_set(this.ds_package, 0, "GUBUN^3");
                this.ds_master.set_enableevent(true);
                break;
            }

            var vRtn = this.gf_SelectSql_sync("ds_temp: select cvstatus from vndmst where cvcod = '" + va_Data[0][0] + "'  ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

            if (vRtn[1] == '1') {
                alert("사용중지된 거래처이므로 주문접수 불가합니다.");
                this.ds_master.setColumn(0, "CVCOD", '');
                return;
            }

            if (this.ff_Vndwarn(va_Data[0], "ds_master", "CON_CVCOD", "4773") == -1) return;
            // 병원도 Default로 같이 Setting
            var vCon_cvcod = this.ds_master.getColumn(0, "CON_CVCOD");
            vDw = this.ds_master;
            vRow = this.ds_master.rowposition;
            vDw.set_enableevent(false);
            if (NXCore.isEmpty(vCon_cvcod)) {
                vDw.setColumn(vRow, "CON_CVCOD", va_Data[0][0]);
                vDw.setColumn(vRow, "CON_CVNAS", va_Data[0][2]);
                vDw.setColumn(vRow, "CON_OWNAM", va_Data[0][6]);
                vDw.setColumn(vRow, "SAREA", va_Data[0][13]);
                vDw.setColumn(vRow, "EMP_ID", va_Data[0][14]);
                vDw.setColumn(vRow, "SALE_EMPNAME", va_Data[0][15]);

                vDw.setColumn(vRow, "OWNAM", va_Data[0][6]);
                vDw.setColumn(vRow, "CVNAS", va_Data[0][2]);
                vDw.setColumn(vRow, "CVCOD", va_Data[0][0]);

                this.ff_Trans_Set(va_Data[0][0], this.ds_trans.getColumn(0, "TRANS_GU"));
            }

            vDw.setColumn(vRow, "CVCOD", va_Data[0][0]);
            vDw.setColumn(vRow, "CVNAS", va_Data[0][2]);
            vDw.setColumn(vRow, "OWNAM", va_Data[0][6]);

            // pdh *conv* vDw.SetActionCode(1);
            // pdh *conv* vDw.SelectText ( 1, 0 );
            this.ds_master.set_enableevent(true);

            this.ff_Package_Reset(va_Data[0][0], '%');
            this.ff_Pkgchk();
            this.ff_History(va_Data[0][0]);
            //this.ff_Danga_Full();


            break;
        case "popup_ed_CON_CVCOD_master":
        case "popup_ed_CON_OWNAM_master":
            vDw = this.ds_master;
            vRow = this.ds_master.rowposition;
            if (va_Data == false) {
                this.ds_master.set_enableevent(false);
                vDw.setColumn(vRow, "CON_CVCOD", null);
                vDw.setColumn(vRow, "CON_CVNAS", null);
                vDw.setColumn(vRow, "CON_OWNAM", null);
                this.ds_master.set_enableevent(true);
                return;
            }
            if (this.ff_Vndwarn(va_Data[0], "ds_master", "CON_CVCOD", "4822") == -1) return;

            this.ds_master.set_enableevent(false);

            vDw.setColumn(vRow, "CON_CVCOD", va_Data[0][0]);
            vDw.setColumn(vRow, "CON_CVNAS", va_Data[0][2]);
            vDw.setColumn(vRow, "CON_OWNAM", va_Data[0][6]);
            vDw.setColumn(vRow, "SAREA", va_Data[0][13]);

            vDw.setColumn(vRow, "EMP_ID", va_Data[0][14]);
            vDw.setColumn(vRow, "SALE_EMPNAME", va_Data[0][15]);

            this.ff_Trans_Set(va_Data[0][0], this.ds_trans.getColumn(0, "TRANS_GU"));
            this.ds_master.set_enableevent(true);
            break;

        case "popup_edt_Empno_master":
            this.ds_master.set_enableevent(false);
            this.Div_content.ed_emp_id.set_value(va_Data[0][0]);
            this.Div_content.ed_sale_empname.set_value(va_Data[0][1]);
            this.ds_master.set_enableevent(true);
            break;
        case "popup_edt_ji_Empno_master":
            this.ds_master.set_enableevent(false);
            this.Div_content.ed_ji_empno.set_value(va_Data[0][0]);
            this.Div_content.ed_ji_empname.set_value(va_Data[0][1]);
            this.ff_Depot(va_Data[0][0]);
            this.ds_master.set_enableevent(true);
            break;

        case "popup_ed_sales_empno_head":      // 사원 찾기 head에서 변경되었을경우
            if (va_Data == false) {
                this.ds_head.setColumn(0, "SALES_EMPNO", "");
                this.ds_head.setColumn(0, "SALES_EMPNAME", "");
            }
            else {
                this.ds_head.setColumn(0, "SALES_EMPNO", va_Data[0][0]);
                this.ds_head.setColumn(0, "SALES_EMPNAME", va_Data[0][1]);
            }
            break;

        case "popup_ed_ji_empno_head":      // 사원 찾기 head에서 변경되었을경우 
            if (va_Data == false) {
                this.ds_head.setColumn(0, "JI_EMPNO", "");
                this.ds_head.setColumn(0, "JI_EMPNAME", "");
            }
            else {
                this.ds_head.setColumn(0, "JI_EMPNO", va_Data[0][0]);
                this.ds_head.setColumn(0, "JI_EMPNAME", va_Data[0][1]);
            }
            break;
        case "popup_ed_cvcod_head":      // 계약처 찾기  
            if (va_Data == false) {
                this.ds_head.setColumn(0, "CVCOD", "");
                this.ds_head.setColumn(0, "CVNAS", "");
            }
            else {
                this.ds_head.setColumn(0, "CVCOD", va_Data[0][0]);
                this.ds_head.setColumn(0, "CVNAS", va_Data[0][2]);
            }
            break;

        case "popup_ed_con_cvcod_head":
            if (va_Data == false) {
                this.ds_head.setColumn(0, "CON_CVCOD", "");
                this.ds_head.setColumn(0, "CON_CVNAS", "");
            }
            else {
                this.ds_head.setColumn(0, "CON_CVCOD", va_Data[0][0]);
                this.ds_head.setColumn(0, "CON_CVNAS", va_Data[0][2]);
            }
            break;
        case "co_popu_itnkit":
            var vi_rbtn_init = 0;
            var vfind = 0;
            var vs_sql;

            for (var i = 0; i < va_Data.length; i++) {
                var vItnbr = this.ds_detail.getColumn(vInsrow, "ITNBR");

                if (va_Data[i][0] == vItnbr) {
                    var vInsrow;
                    vInsrow = this.ds_detail.rowposition;

                    var vfind = this.ds_detail.findRow("ITNBR", va_Data[i][0]);

                    this.ds_detail.set_enableevent(false);

                    this.ds_detail.setColumn(vfind, "ITNBR", va_Data[i][0]);

                    this.ds_detail.setColumn(vfind, "ORDER_PRC", va_Data[i][1]);
                    this.ds_detail.set_enableevent(true);
                }
                else {
                    var vInsrow;
                    var vamt = 0;
                    vInsrow = this.ds_detail.rowposition;
                    vi_rbtn_init = vi_rbtn_init + 1;

                    vInsrow = this.ds_detail.addRow();


                    this.gsi_dataset_zero_set(this.ds_detail, vInsrow, fvs_default_detail);
                    //vDw.set_enableevent(false);

                    this.ds_detail.setColumn(vInsrow, "ITNBR", va_Data[i][0]);

                    /*
                    vDw.setColumn( vInsrow,   "PRODNM",   va_Data[i][3]);
                    vDw.setColumn( vInsrow,   "ITDSC",    va_Data[i][4]);
                    vDw.setColumn( vInsrow,   "ISPEC",    va_Data[i][5]);
                    */
                    var vSql = "Select fct_gbn, ins_claim_yn From ITEMAS_ADD_INFO Where ITNBR = '" + va_Data[i][0] + "'";
                    var vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_reffpf_5A", "ff_Callback_sync", 0);

                    if (vi_ErrorCode < 0) {
                        return false;
                    }
                    this.ds_detail.setColumn(vInsrow, "FACGBN", vRtn[1]);
                    this.ds_detail.setColumn(vInsrow, "INS_CLAIM_YN", vRtn[2]);
                    var vSugugb = this.ds_master.getColumn(0, "SUGUGB");

                    // 수불구분은 수주구분에 의해 처리
                    var vIogbn = this.gf_SelectSql_sync("ds_temp: select rfna2, rfna3 from reffpf where rfcod = '5A' and rfgub = '" + vSugugb + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
                    this.ds_detail.setColumn(vInsrow, "CUST_NAPGI", vToday);
                    this.ds_detail.setColumn(vInsrow, "OUT_GU", vIogbn[2]);
                    this.ds_detail.set_enableevent(true);

                    if (NXCore.isEmpty(va_Data[i][1])) {
                        vamt = 0;
                    } else {
                        vamt = va_Data[i][1];
                    }


                    this.ff_Danga(va_Data[i][0], vInsrow, 'KRW', 'Auto');
                    this.ds_detail.setColumn(vInsrow, "ORDER_PRC", vamt);
                }
            }




            break;

        case "sm_send::sm_send_trans_e.xfdl":     // 이문장은 프로그램 주소및 프로그램 id일껏 

            for (var i = 0; i < va_Data.length; i++) {

                this.ds_trans.setColumn(0, 'TRANS_GU', va_Data[i][13]);
                this.ds_trans.setColumn(0, 'TRANS_CVCOD', va_Data[i][1]);
                this.ds_trans.setColumn(0, 'TRANS_HUMAN', va_Data[i][6]);
                this.ds_trans.setColumn(0, 'TRANS_TELNO', va_Data[i][7]);
                this.ds_trans.setColumn(0, 'TRANS_ADDR', va_Data[i][4]);
                this.ds_trans.setColumn(0, 'TRANS_ADDR1', va_Data[i][5]);
                this.ds_trans.setColumn(0, 'CVNAS', va_Data[i][9]);
                this.ds_trans.setColumn(0, 'OWNAM', va_Data[i][8]);
                this.ds_trans.setColumn(0, 'TRANS_POSNO', va_Data[i][3]);
            }
            break;
    }
    return;
}




this.Div_content_ed_cvcod_onrbuttondown = function (obj: Edit, e: nexacro.MouseEventInfo) {

    var vData = obj.value;
    vName = obj.name;
    switch (obj.name) {

        case "ed_ji_empno":
            this.ff_co_popu_sawon_sale_f("popup_edt_ji_Empno_master", '' + '|' + '' + '|' + vData);
            break;
        case "ed_emp_id":
            this.ff_co_popu_sawon_sale_f("popup_edt_Empno_master", '' + '|' + '' + '|' + vData);
            break;

        case "ed_cvcod":
        case "ed_ownam":
            var vOpenParam = new Array();
            vOpenParam[0] = null;
            vOpenParam[1] = null;
            vOpenParam[3] = null;
            vOpenParam[4] = null;
            vOpenParam[5] = null;
            if (vName == "ed_cvcod")
                vOpenParam[1] = vData;          // 코드
            else
                vOpenParam[5] = vData;          // 명칭 
            //vOpenParam[5] = vData;
            this.ff_co_popu_vndsale_f("popup_ed_CVCOD_master", vOpenParam);
            break;
        case "ed_con_cvcod":
        case "ed_con_ownam":
            var vOpenParam = new Array();
            vOpenParam[0] = null;
            vOpenParam[1] = null;
            vOpenParam[3] = null;
            vOpenParam[4] = null;
            vOpenParam[5] = null;
            if (vName == "ed_con_cvcod")
                vOpenParam[1] = vData;
            else
                vOpenParam[5] = vData;
            this.ff_co_popu_vndsale_f("popup_ed_CON_CVCOD_master", vOpenParam);
            break;
        case "ed_trans_cvcod":
        case "ed_trans_sarea":
            var vOpenParam = new Array();
            vOpenParam[0] = null;
            vOpenParam[1] = vData;
            vOpenParam[3] = null;
            vOpenParam[4] = null;
            vOpenParam[5] = null;
            //vOpenParam[5] = vData;
            this.ff_co_popu_vndsale_f("popup_ed_TRANS_CVCOD_trasn", vOpenParam);
            break;
        case "msk_trans_posno":
            vs_Arg = '';
            var resultForm = this.gf_showPopup("popup_object_posno", "hr_co_popu::hr_co_popu_addr_f.xfdl", { width: 10, height: 20 },
                {
                    OpenRetv: 'Y',   // popup open 즉시 조회  
                    MultSelect: 'N',   // MULTI LINE 선택
                    Argument: vs_Arg  // 조회조건 파라메터 
                }, { modal: true, layered: true, autosize: false, callback: "ff_AfterPopup" });
            break;
        default:
            break;
    }

}

this.Div_content_btn_trans_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vOrder_no = this.ds_master.getColumn(0, "ORDER_NO");
    /*if (!NXCore.isEmpty(vOrder_no) &&  vOrder_no != ''  )
    {
    	
        var vOrder = vOrder_no.substr(0,12);
    	
        var vRtn = this.gf_SelectSql_sync("ds_temp: Select count(*) From jpnoprint Where tab_nm = 'SORDER' AND jpno = '" +  vOrder + "'  ", "SELECT_reffpf_5A", "ff_Callback_sync",0);
    	
        if(vRtn[1] > 0)
        {
            alert('이미 배송준비가 되어 수정할 수 없습니다.');
            return;
        }
    }*/
    var vs_pgrm_id = "sm_send::sm_send_trans_e.xfdl";   // <----- 호출 하고자 하는 프로그램 주소와 프로그램 id  
    var vs_arg = this.ds_master.getColumn(0, "CON_CVCOD") + '|' + this.ds_master.getColumn(0, "CON_CVNAS");                                  // <------ 넘기고자 하는 파람메터
    var resultForm = this.gf_showPopup(vs_pgrm_id, "comm::COM_POPUP_WORKFRAME.xfdl", { width: 964, height: 575 },
        {
            OpenRetv: 'N',       // popup open 즉시 조회 
            MultSelect: 'N',          // MULTI LINE 선택
            Argument: vs_arg,      // 윗 프로그램에 넘겨줄 값
            Argument_pgrm_id: vs_pgrm_id      //<---------호출하고자 하는 프로그램 id
        }, { modal: true, layered: true, autosize: true, showtitlebar: true, resizable: true, callback: "ff_AfterPopup_pgrm" });
}


//  div_content 값중 프로텍트    신규 입력시에만 enabel 한다. 
this.ff_protect_content = function (arg_value) {
    this.Div_content.ed_cvcod.set_enable(arg_value);
    this.Div_content.ed_ownam.set_enable(arg_value);
    this.Div_content.cal_order_date.set_enable(arg_value);
    this.Div_content.ed_con_cvcod.set_enable(arg_value);
    this.Div_content.ed_con_ownam.set_enable(arg_value);


    this.Div_content.cbo_depot_no.set_enable(arg_value);
    this.Div_content.cbo_misayu.set_enable(arg_value);

    if (arg_value == false) {
        this.Div_content.cbo_sorder_gwgbn.set_cssclass('readonly');
        this.Div_content.cbo_sorder_gwgbn.set_readonly(true);
        this.Div_content.ed_emp_id.set_cssclass('readonly');
        this.Div_content.ed_emp_id.set_readonly(true);
        this.Div_content.ed_order_memo.set_cssclass('readonly');
        this.Div_content.ed_order_memo.set_readonly(true);
        this.Div_content.ed_ji_empno.set_cssclass('readonly');
        this.Div_content.ed_ji_empno.set_readonly(true);
    }
    else {
        this.Div_content.cbo_sorder_gwgbn.set_cssclass('');
        this.Div_content.cbo_sorder_gwgbn.set_readonly(false);
        this.Div_content.ed_emp_id.set_cssclass('');
        this.Div_content.ed_emp_id.set_readonly(false);
        this.Div_content.ed_order_memo.set_cssclass('');
        this.Div_content.ed_order_memo.set_readonly(false);
        this.Div_content.ed_ji_empno.set_cssclass('');
        this.Div_content.ed_ji_empno.set_readonly(false);
    }



}

this.Div_detail_btn_detail_delete00_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    if (this.ds_detail.rowcount < 1) return;
    this.gf_excel_download(this.gd_detail);
}

this.Div_detail_btn_detail_mob_ok_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    if (!application.confirm("모바일 주문건에 대해서 승인하시겠습니까?")) {
        return;
    }

    var vs_today = this.gf_today();
    var vs_sql = "", vs_order_no = "";

    for (var i = 0; i < this.ds_detail.rowcount; i++) {
        if (!NXCore.isEmpty(this.ds_detail.getColumn(i, "ORD_OK_DATE")) && this.ds_detail.getColumn(i, "ORD_OK_DATE") != "")
            continue;

        this.ds_detail.setColumn(i, "ORD_OK_DATE", vs_today);

        if (vs_sql != "") vs_sql += " @#$ ";

        vs_order_no = this.ds_detail.getColumn(i, "ORDER_NO");

        vs_sql += " UPDATE SORDER SET ORD_OK_DATE = '" + vs_today + "' WHERE ORDER_NO = '" + vs_order_no + "' ";
    }

    fvs_mob_cancel = "N";

    this.gf_UpdateSql_sync(vs_sql, "ORD_OK_CANCEL_UPDATE", "ff_Callback_sync", 0);

    this.Div_detail.btn_detail_mob_ok.set_visible(false);
    this.Div_detail.btn_detail_mob_cncl.set_visible(true);
}

this.Div_detail_btn_detail_mob_cncl_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    if (!application.confirm("모바일 주문건에 대해서 취소하시겠습니까?")) {
        return;
    }

    var vs_sql = "", vs_order_no = "";

    for (var i = 0; i < this.ds_detail.rowcount; i++) {
        if (NXCore.isEmpty(this.ds_detail.getColumn(i, "ORD_OK_DATE")) || this.ds_detail.getColumn(i, "ORD_OK_DATE") == "")
            continue;

        if (this.ds_detail.getColumn(i, "OUT_QTY") != 0)
            continue;

        this.ds_detail.setColumn(i, "ORD_OK_DATE", "");

        if (vs_sql != "") vs_sql += " @#$ ";

        vs_order_no = this.ds_detail.getColumn(i, "ORDER_NO");

        vs_sql += " UPDATE SORDER SET ORD_OK_DATE = '' WHERE ORDER_NO = '" + vs_order_no + "' ";
    }

    this.gf_UpdateSql_sync(vs_sql, "ORD_OK_CANCEL_UPDATE", "ff_Callback_sync", 0);

    fvs_mob_cancel = "Y";

    this.Div_detail.btn_detail_mob_ok.set_visible(true);
    this.Div_detail.btn_detail_mob_cncl.set_visible(false);
}

this.Div_detail_btn_detail_add00_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vs_openRetv = 'Y';
    var vs_args = '';

    // 엑셀등록 양식을 다운 받겠습니까?
    if (this.gf_message_chk("121924", "") == 1) {
        vs_openRetv = 'N';
        this.gf_excel_download(this.grd_excel);
    }

    var vs_args = this.gf_get_trans_word(" ◎ 항목설명") + "\n"
        + this.gf_get_trans_word("	1. No. : 순번(입력 불필요)") + "\n"
        + this.gf_get_trans_word("	2. 형번,수량 : 입력") + "\n"
        + "\n"
        + this.gf_get_trans_word(" ◎ 주의사항") + "\n"
        + this.gf_get_trans_word("	1. 엑셀 양식을 임의로 변경불가(항목 삭제/추가 불가)");

    var resultForm = this.gf_showPopup("popup_excel_upload", "co_popu::co_popu_excelupload_ex.xfdl", { width: 10, height: 20 },
        {
            OpenRetv: vs_openRetv,	// popup 즉시 파일찾기
            Argument: vs_args  		// 조회조건 파라메터 
        }, { callback: "ff_AfterPopup" });
}

/*출력물 호출*/
this.printview = function () {

    /*Local Dataset의 정보를 설정한다.*/
    var localDatasetArray = [];			/*배열선언*/
    // report의 sqlid, datasetid
    /*첫번째값은 UbiDesigner2.5에서 작성한 SQL 이름을 작성한다.*/
    /*두번째값은 UbiDesigner2.5에서 디자인 편집한 컬럼과 동일한 dataset이름을 작성*/
    localDatasetArray.push(["si_send_order_neo_quickaddr_q_1r", this.ds_print]);

    /*리포트 FORM에 전달할 아규먼트*/
    // isRuntime, reportfile, datasets, gridobj, isLocalDataset
    //   - isRuntime       : 런타임리포트 여부 (dataset trasaction을 사용할 경우 false)
    //   - gridobj         : isRuntime이 true일 때만 설정 (그리드 객체를 설정)
    //   - reportfile      : 리포트 파일명
    //   - reportfold      : 폴더위치명(..report/폴더 이후위치) D:\A03_POP_SOURCE\nexacro_dongseo\pj\dongseo\report\kum\ref
    //   - datasets        : (localdatasets 사용시 필요없음) Dataset을 호출할 Transaction 정보를 담고있는 배열
    //   - localdatasets   : 로드된 Dataset을 이용하는 경우 사용
    //	 - arg             : SELECT 아규먼트 전송 예)변수명1#변수값1#변수명2#변수값2#.......#   "ARG_LANG#KO#ARG_SAUPJ#20#ARG_KUMNO#DC08534822#ARG_URL#http://127.0.0.1:8087/erpman/#";

    var vs_Sign = 'neo/img/logo_neo_invoice.png';

    var vs_arg = 'ARG_ORDER_NO#' + this.ds_list.getColumn(this.ds_list.rowposition, 'ORDER_NO') + '#';
    vs_arg = vs_arg + 'ARG_URL#' + "http://" + this._gf_getSvcHost() + "/" + application.gvs_context + "/deploy/" + vs_Sign + '#';
    vs_arg = vs_arg + 'ARG_LANG#' + application.gv_lang + '#';

    var arglist = { isRuntime: false, reportfile: "sm_send_order_neo_quickaddr_q_1r.jrf", reportfold: "sm/send", arg: vs_arg, localdatasets: localDatasetArray };
    this.showReport(arglist);
}

/*출력물 미리보기*/
this.showReport = function (arglist) {
    var objChildFrame = new ChildFrame();
    objChildFrame.init("UbiReport", "absolute", 30, 30, 900, 780, null, null, "comm::COMUBIP01.xfdl");
    objChildFrame.set_showtitlebar(false);
    objChildFrame.set_openalign("center middle");
    var varRet = objChildFrame.showModal(null, arglist, this);
}

this.ds_list_onrowposchanged = function (obj: Dataset, e: nexacro.DSRowPosChangeEventInfo) {
    if (e.newrow == -1) return;

    this.ds_detail.clearData();

    var vOrder_no = this.ds_list.getColumn(e.newrow, "ORDER_NO").substr(0, 12);
    var vCvcod = this.ds_list.getColumn(e.newrow, "CVCOD");
    var vOrder_date = this.ds_list.getColumn(e.newrow, "ORDER_DATE");

    this.ds_head.setColumn(0, "ARG_ORDER_NO", vOrder_no);
    this.ds_head.setColumn(0, "ARG_CVCOD", vCvcod);
    this.ds_head.setColumn(0, "ARG_ORDER_DATE", vOrder_date);

    this.ff_Tran_sync("SELECT_DETAIL");
}
//주문등록버튼
this.Div_head_btn_order_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    if (this.ds_list.rowcount < 1) return;

    for (var i = 0; i <= this.ds_list.rowcount - 1; i++) {

        if (this.ds_list.getColumn(i, "CHK") == '1') {

            var vs_Cvcod = this.ds_list.getColumn(i, "CVCOD");
            var vs_Order_date = this.ds_list.getColumn(i, "ORDER_DATE");
            var vs_Estno = this.ds_list.getColumn(i, "ESTNO");
            var vs_Trans_gu = this.ds_list.getColumn(i, "DEPTNO");
            var vs_Trans_cvcod = this.ds_list.getColumn(i, "CON_CVCOD");
            var vs_Trans_yn = this.ds_list.getColumn(i, "TRANS_YN");
            var vs_Order_no = this.ds_list.getColumn(i, "ORDER_NO");
            var vs_Trans_cgbn = this.ds_list.getColumn(i, "AGRDAT");

            if (NXCore.isEmpty(vs_Estno) || vs_Estno == '') {
                vs_Estno = '%';
            }

            if (vs_Trans_yn == 'N') {
                alert('이체단가가 없습니다. 먼저 이체단가를 등록하세요!!');
                return;
            }
            if (NXCore.isEmpty(ivEmpno)) {
                ivEmpno = application.gvs_empid;
            }
            var vArgspro = vs_Order_date + "|" + vs_Cvcod + "|" + vs_Estno + "|" + vs_Trans_gu + "|" + vs_Trans_cvcod + "|" + '1' + "|" + vs_Order_no + "|" + vs_Trans_cgbn + "|" + ivEmpno;

            this.gf_Procedure_sync("SP_SORDER_CREATE", vArgspro, "PROCEDURE", "ff_Callback_sync", 0);
        }

    }

    alert('주문이 완료되었습니다.');

    this.btn_query_onclick();

}

this.Div_detail_btn_wait_detail_delete_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {

    var ii = this.ds_detail.rowcount;
    var vRow = this.ds_detail.rowposition;
    if (vRow < 0) return;
    //alert(this.ds_detail.getColumn(vRow, "ORDER_NO"));
    this.gf_UpdateSql_sync("Delete from sorder_wait  Where order_no Like '" + this.ds_detail.getColumn(vRow, "ORDER_NO") + "'||'%' ", "Delete_sorder_wait", "ff_Callback_sync", 0);

    this.ds_detail.deleteRow(vRow);



}

//20240612 패키지 마스타 출고제한 수량 체크
this.ff_pkgmstlimit_Chk = function () {

    this.ds_head2.clearData();
    this.ds_head2.addRow();

    this.ds_head2.setColumn(0, "ARG_ESTNO", this.ds_master.getColumn(0, "ESTNO"));

    if (NXCore.isEmpty(this.ds_master.getColumn(0, "ORDER_NO")) || this.ds_master.getColumn(0, "ORDER_NO") == "") {
        this.ds_head2.setColumn(0, "ARG_ORDER_NO", "%");
    } else {
        this.ds_head2.setColumn(0, "ARG_ORDER_NO", this.ds_master.getColumn(0, "ORDER_NO").substr(0, 12));
    }

    this.ff_Tran_sync("SELECT_PKGQTY");

    for (var i = 0; i < this.ds_pkgqty.rowcount; i++) {
        var v_pkgIttyp = this.ds_pkgqty.getColumn(i, "ITTYP");
        var v_pkgItcls1 = this.ds_pkgqty.getColumn(i, "ITCLS1");
        var v_pkgItcls2 = this.ds_pkgqty.getColumn(i, "ITCLS2");
        var v_pkgItcls3 = this.ds_pkgqty.getColumn(i, "ITCLS3");
        var v_pkgOrderQty = this.ds_pkgqty.getColumn(i, "ORDER_QTY");
        var v_pkgBanpumQty = this.ds_pkgqty.getColumn(i, "BUNPUM_QTY");
        var v_pkgLimitQty = this.ds_pkgqty.getColumn(i, "LIMIT_QTY");
        var v_pkgOrderQty_old = v_pkgOrderQty;

        v_pkgOrderQty = v_pkgOrderQty - v_pkgBanpumQty;

        for (var j = 0; j < this.ds_detail.rowcount; j++) {
            var nRowType = this.ds_detail.getRowType(j);

            if (nRowType == 8) {
                continue;
            }
            var vSql = "SELECT ITTYP, ITCLS FROM ITEMAS WHERE ITNBR = '" + this.ds_detail.getColumn(j, "ITNBR") + "' ";
            var vRtn = this.gf_SelectSql_sync("ds_temp:" + vSql, "SELECT_reffpf_5A", "ff_Callback_sync", 0);
            if (vi_ErrorCode < 0) return false;

            var v_Ittyp = vRtn[1];
            var v_Itcls = vRtn[2];

            if (this.ds_pkgqty.getColumn(i, "ITTYP") == v_Ittyp) {
                if (v_pkgItcls1 == v_Itcls.substr(0, v_pkgItcls1.length) || (v_pkgItcls2 == v_Itcls.substr(0, v_pkgItcls2.length) && !NXCore.isEmpty(v_pkgItcls2)) || (v_pkgItcls3 == v_Itcls.substr(0, v_pkgItcls3.length) && !NXCore.isEmpty(v_pkgItcls3))) {
                    v_pkgOrderQty = v_pkgOrderQty + this.ds_detail.getColumn(j, "ORDER_QTY");

                    if (v_pkgLimitQty >= (v_pkgOrderQty)) {
                        this.ds_pkgqty.setColumn(i, "ORDER_QTY", v_pkgOrderQty);
                    } else {
                        var msgText = this.ds_pkgqty.getColumn(i, "TITNM1");
                        if (!NXCore.isEmpty(this.ds_pkgqty.getColumn(i, "TITNM2")) && this.ds_pkgqty.getColumn(i, "TITNM2") != "") msgText = msgText + ', ' + this.ds_pkgqty.getColumn(i, "TITNM2");
                        if (!NXCore.isEmpty(this.ds_pkgqty.getColumn(i, "TITNM3")) && this.ds_pkgqty.getColumn(i, "TITNM3") != "") msgText = msgText + ', ' + this.ds_pkgqty.getColumn(i, "TITNM3");

                        this.gf_message_chk("521498", " \n 품목구분 : " + msgText + " \n 총 주문 수량(기등록 + 신규 등록) : " + v_pkgOrderQty + ", 반품 수량 : " + v_pkgBanpumQty + " \n 주문 가능 수량 : " + (v_pkgLimitQty - v_pkgOrderQty_old + v_pkgBanpumQty) + ", 출고제한 수량 : " + v_pkgLimitQty);
                        return false;
                    }
                }
            }
        }
    }
    return true;
}

this.fn_checkdata = function () {
    if (this.ds_detail.getDeletedRowCount() > 0) { // 삭제된 데이터가 있다면,
        return true;
    }

    for (var i = 0; i < this.ds_detail.rowcount; i++) {
        var nRowType = this.ds_detail.getRowType(i);
        if (nRowType == 2 || nRowType == 8) { // 신규나 삭제된게 있다면,
            return true;
        } else if (nRowType == 4) {
            // 변경된 후 데이터
            var sCurDataitnbr = this.ds_detail.getColumn(i, "ITNBR");

            // 변경되기 전 데이터
            var sOrgDataitnbr = this.ds_detail.getOrgColumn(i, "ITNBR");
            // 변경된 후 데이터
            var sCurDatajisi = this.ds_detail.getColumn(i, "ORDER_QTY");

            // 변경되기 전 데이터
            var sOrgDatajisi = this.ds_detail.getOrgColumn(i, "ORDER_QTY");

            if (sCurDataitnbr != sOrgDataitnbr || sCurDatajisi != sOrgDatajisi) {
                return true;
            }
        }
    }

    return false;
}
