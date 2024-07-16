/***********************************************************************
 * 01. Creation date      : 2015.08.28
 * 02. Created by         : 원현욱
 * 03. Revision history   : 
 ************************************************************************/

/*************************************************************************************************************
* 프로그램 필수 
*************************************************************************************************************/
include "lib::common_form.xjs";
include "si_co::si_comm_function.xjs";

//item changed를 통해 쿼리가 변경 될 경우 사용, 아닐경우 ff_Tran()에서 직접 입력
var pvs_SvcAct, pvs_Save_SvcAct;
var pvs_OutDataset, pvs_InDataset, pvs_Save_OutDataset, pvs_Save_InDataset;

this.vi_ErrorCode = undefined;     // 콜백루틴의 에러코드        싱크트란잭션일경우 사용
this.vs_ErrorMsg = undefined;      //// 콜백루틴의 에러메세지    싱크트란잭션일경우 사용
var input_Mode;					// 등록, 삭제모드 

var fvs_9x;		// 1:절사,2:반올림
var fvn_9y;		// 위치지정(-1:십단위,0:원단위,1:소수점1자리,2:소수점2자리)
var fvn_9z;		// 부가세(증치세)

var vFocusDw, ivColname;
var ivChk, ivConf;
var vSevToday, ivCurr;
var ivIns, ivDel, icInq, ivUpd; //// 버튼 사용여부

// on load event  페이지가 열릴때
this.form_onload = function (obj: Form, e: nexacro.LoadEventInfo) {
    this.gf_formOnload(obj);
    this.ff_load(obj);
}
//  초기 작업 수행
this.ff_load = function (obj) {
    input_Mode = 'I';

    ivCurr = this.gf_Getsyscnfg('C', 23, '1');

    if (NXCore.isEmpty(ivCurr) || ivCurr == '') {
        ivCurr = "KRW";
    }

    this.ff_SetCondition();   // 초기 조건 파라메터 셋팅밍 콤보 셋팅
}

// 초기 조건 파라메터 셋팅밍 콤보 셋팅
this.ff_SetCondition = function () {
    vSevToday = this.gf_today();
    //ITEM CHANGED로 인해 쿼리 변경 될 때 이용
    //초기 쿼리랑 데이터셋 정의 
    pvs_SvcAct = "em/orde/em_orde_exppih_e_1q.jsp";
    pvs_OutDataset = "ds_Detail=output1 ds_Detail_1=output2 ds_Detail_2=output3";  // 반드시 output1으로 기술할것		   
    pvs_InDataset = "ds_para=ds_Head";
    pvs_Save_SvcAct = "em/orde/em_orde_exppih_e_1tr.jsp";
    pvs_Save_InDataset = "input1=ds_Detail:U input2=ds_Detail_1:U input3=ds_Detail_2:U";
    pvs_Save_OutDataset = ""
    // 초기 값 세팅
    // 콤보 데이타셋 조회 
    this.ds_Head.clearData();
    this.ds_Detail.clearData();
    this.ds_Detail_1.clearData();
    this.ds_Detail_2.clearData();
    this.ds_Head.addRow();
    this.ds_Detail.addRow();
    // combo 세팅 argumnet 5번자리 : @A 전체 포함, @N null 포함
    this.gf_combo_head_sync(this.ds_Head, "ARG_SAUPJ", this.div_Head.cbo_Saupj, "co_dddw_reffpf_f_ad1", "", 0);
    this.gf_combo_head_sync(this.ds_Head, "PISTS", this.div_Head.cbo_Pists, "1^견적@2^확정@3^보류@4^취소@9^완료", "", 0);

    this.gf_combo_head_sync(this.ds_Detail, "TUNCU", this.Tab00.tabpage1.Div_Detail.cbo_Cunit, "co_dddw_reffpf_f_10_med", "", 0);
    this.gf_combo_head_sync(this.ds_Detail, "TRANS", this.Tab00.tabpage1.Div_Detail.cbo_Trans, "co_dddw_reffpf_f_36_a", "", 0);
    this.gf_combo_head_sync(this.ds_Detail, "INVAFTERNEGO", this.Tab00.tabpage1.Div_Detail.cbo_invafternego, "1^선적후@2^선적전", "", 0);
    this.gf_combo_head_sync(this.ds_Detail, "INSPECTION", this.Tab00.tabpage1.Div_Detail.cbo_paygbn, "co_dddw_reffpf_f_6f", "", 0);		//결제조건

    this.gf_combo_grd_sync(this.Tab00.tabpage2.grd_Detail_1, "DEPOT_NO", "co_dddw_depot_exp_saupj", application.gvs_defsaupj, 0);
    this.gf_combo_grd_sync(this.Tab00.tabpage2.grd_Detail_1, "OUT_GU", "O02^판매출고@OA1^기증출고@O18^견본출고", "", 0);
    this.gf_combo_grd_sync(this.Tab00.tabpage2.grd_Detail_1, "ITTYP", "1^완제품@7^상품", "", 0);

    this.gf_combo_grd_sync(this.Tab00.tabpage3.grd_Detail_2, "CHRGU", "co_dddw_reffpf_f_67", "", 0);

    //this.ds_Head.set_enableevent(false);

    if (input_Mode == 'I') {
        //로그인 사업장에 따른 사업장 체크  
        this.gf_check_saupj(this.div_Head.cbo_Saupj);
        this.ds_Head.setColumn(0, "ARG_SAUPJ", application.gvs_defsaupj);
        this.ds_Head.setColumn(0, "ARG_SDATE", this.gf_today());
        this.ds_Head.setColumn(0, "LOCALYN", 'N');
        this.ds_Head.setColumn(0, "PISTS", '1');
        this.ds_Head.setColumn(0, "ARG_ITTYP", '1');// 제품 or 상품 구분값(default : 제품)

        this.ds_Detail.setColumn(0, "OUTSAUPJ", application.gvs_defsaupj);
        this.ds_Detail.setColumn(0, "TITLE", 'Proforma Invoice');
        this.ds_Detail.setColumn(0, "EMP_ID", application.gvs_empid);
        this.ds_Detail.setColumn(0, "SALES_EMPNAME", application.gvs_username);
        this.ds_Detail.setColumn(0, "SHIPREQ", this.gf_today());
        this.ds_Detail.setColumn(0, "INSPECTION", '100');  //결제조건(default:선택)

        this.div_Head.edt_Orderno.set_cssclass("readonly");
        this.div_Head.edt_Orderno.set_readonly(true);
        this.div_Head.sts_Orderno.style.set_background("transparent");
        this.div_Head.rad_ittyp.set_readonly(false); //등록 시에만 활성화.

        this.div_Head.cbo_Saupj.set_cssclass("input_point");
        this.div_Head.cbo_Saupj.set_readonly(false);
        this.div_Head.edt_Cvcod.set_cssclass("input_point");
        this.div_Head.edt_Cvcod.set_readonly(false);
        this.div_Head.cal_Sdate.set_cssclass("input_point");
        this.div_Head.cal_Sdate.set_readonly(false);

        this.div_Head.edt_Orderno.set_cssclass("readonly");
        this.div_Head.edt_Orderno.set_readonly(true);
        this.div_Head.sts_Orderno.style.set_background("transparent");
        this.div_Head.edt_Cvcod.setFocus();

        //this.Tab00.tabpage1.Div_Detail.set_enable(true);
        this.Tab00.tabpage2.grd_Detail_1.set_enable(true);
        this.Tab00.tabpage3.grd_Detail_2.set_enable(true);

        //tabpage1 enable 처리
        this.Tab00.tabpage1.Div_Detail.cbo_paygbn.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.txt_attn.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.edt_pifrom.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.edt_semno.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.edt_pono.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.edt_emp_id.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.edt_Areacd.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.cbo_Cunit.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.msk_old_piamt.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.cal_Shipreq.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.cal_Shipsch.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.cal_Invsch.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.cbo_Trans.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.edt_packing.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.cbo_invafternego.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.edt_payment.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.edt_terms.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.edt_Shipment.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.edt_banknm.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.edt_accno.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.edt_accno00.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.edt_swiftcode.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.txt_bankaddr.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.edt_Origin.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.edt_pimaker.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.edt_pisangho.set_enable(true);
        this.Tab00.tabpage1.Div_Detail.txt_Pinotes.set_enable(true);

    }
    else {

        this.div_Head.cbo_Saupj.set_cssclass("readonly");
        this.div_Head.cbo_Saupj.set_readonly(true);
        this.div_Head.edt_Cvcod.set_cssclass("readonly");
        this.div_Head.edt_Cvcod.set_readonly(true);
        this.div_Head.cal_Sdate.set_cssclass("readonly");
        this.div_Head.cal_Sdate.set_readonly(true);
        this.div_Head.rad_ittyp.set_readonly(true); //품목구분
        this.ds_Head.setColumn(0, "ARG_ITTYP", '1');

        this.div_Head.edt_Orderno.set_cssclass("input_point");
        this.div_Head.edt_Orderno.set_readonly(false);
        this.div_Head.sts_Orderno.style.set_background("transparent URL('theme://btn_WF_EditSearchN.png') right middle");
        this.div_Head.edt_Orderno.setFocus();

    }

    vs_OpenRetv = this.parent.parent.fvs_OpenRetv;    // 넘어온 파라메터 값 
    vs_MultSelect = this.parent.parent.fvs_MultSelect;    // 넘어온 파라메터 값 
    vs_Argument = this.parent.parent.fvs_Argument;    // 넘어온 파라메터 값

    if (!NXCore.isEmpty(vs_Argument) && vs_Argument != '') {

        var vs_param = vs_Argument.split('|');
    }

    //var vs_param = vs_Argument.split('|');

    /*if (!NXCore.isEmpty(this.parent.parent.fvs_OpenRetv) && vs_param[0] == '1') 
    {
        
        ivChk = "2";

        this.ds_Head.setColumn(0, 'ARG_CVCOD',vs_param[1]);
        
        var vs_event = new nexacro.ChangeEventInfo();

        vs_event.newvalue = vs_param[1];

        vs_event.obj.name = "edt_Cvcod";

        vs_event.row = 0;
                    	
        this.ff_Object_onitemchanged(this.ds_Head,vs_event);
                
    }*/
    if (NXCore.isEmpty(this.parent.parent.fvs_OpenRetv)) {

        //this.ds_Head.set_enableevent(true);
    }
    else {

        ivChk = '2';

        input_Mode = 'M';

        this.div_Input_Mode.Div00.btn_Modify.bringToPrev();
        this.div_Input_Mode.Div00.btn_Input.style.set_opacity(40);
        this.div_Input_Mode.Div00.btn_Modify.style.set_opacity(100);

        this.ds_Head.setColumn(0, "ARG_ORDERNO", vs_param[0]);

        this.div_Head.edt_Cvcod.set_cssclass("readonly");
        this.div_Head.edt_Cvcod.set_readonly(true);
        this.div_Head.rad_ittyp.set_readonly(true); //품목구분

        this.parent.parent.fvs_OpenRetv = '';

        this.btn_query_onclick();

        return;
    }

    //this.ds_Head.set_enableevent(true);

}

this.ff_SetPiamt = function () {
    var vPists;
    var nWrate = 0, nUrate = 0, nWeight = 0;
    var nRowcnt2 = 0, nRowcnt3 = 0;

    //// Detail, charge 금액을 현재 환율로 재계산
    var nPiamt = 0, nPiDamt = 0, nChramt = 0;

    nRowcnt2 = this.ds_Detail_1.rowcount;
    nRowcnt3 = this.ds_Detail_2.rowcount;

    if (nRowcnt2 <= 0) {
        return 0;
    }

    vPists = this.ds_Detail.getColumn(0, "PISTS");
    nWrate = this.ds_Detail.getColumn(0, "WRATE");
    nUrate = this.ds_Detail.getColumn(0, "URATE");
    nWeight = this.ds_Detail.getColumn(0, "WEIGHT");

    if ((NXCore.isEmpty(nWrate) || nWrate == '' || nWrate == 0) && (NXCore.isEmpty(nUrate) || nUrate == '' || nUrate == 0)) {
        if (vPists == '1' || vPists == "2" || vPists == "9") {
            alert("확정처리시 필요한 환율이 등록되어있지 않습니다."
                + "확정일자의 환율이 등록되어 있어야 합니다.");
            return -1;
        }
    }

    if (NXCore.isEmpty(nWrate) || nWrate == '') {
        nWrate = 1;
    }

    if (NXCore.isEmpty(nUrate) || nUrate == '') {
        nUrate = 1;
    }

    if (NXCore.isEmpty(nWeight) || nWeight == '') {
        nWeight = 1;
    }

    //-----------------------------------------------
    //// Pi header amt <= Pi detail + Charge amt
    //-----------------------------------------------
    if (nRowcnt2 > 0) {
        nPiDamt = this.Tab00.tabpage2.grd_Detail_1.getSummValue(10);//9
    }

    if (nRowcnt3 > 0) {
        nChramt = this.Tab00.tabpage3.grd_Detail_2.getSummValue(1);
    }

    nPiamt = nPiDamt + nChramt; /// PI 외화금액

    this.ds_Detail.setColumn(0, "PIAMT", nPiamt);

    return 0;
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

    if (NXCore.isModified(this.ds_Detail) || NXCore.isModified(this.ds_Detail_1) || NXCore.isModified(this.ds_Detail_2)) {
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

//조회 
this.btn_query_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    if (!this.ff_required_chk("R")) return;
    if (input_Mode == 'I') return;

    this.ff_Tran("SELECT");
}

// 추가
this.btn_add_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vCvcod, vShipreq, vCnfdat, vPists, vPino, vs_Orderno;
    var vItnbr, vOut_gu, vDepot_no, vSugugb, vPangb;
    var nRowcnt = 0, nQty = 0, nPrc = 0, nOrder_qty = 0;
    var nIns = 0;

    vCvcod = this.ds_Head.getColumn(0, "ARG_CVCOD");
    vCnfdat = this.ds_Head.getColumn(0, "ORDCFDT");
    vPists = this.ds_Head.getColumn(0, "PISTS");
    vs_Orderno = this.ds_Detail.getColumn(0, "ORDER_NO");

    var vi_Tabindex = this.Tab00.tabindex;

    if (vi_Tabindex == 1) {
        nRowcnt = this.ds_Detail_1.rowcount;

        if (nRowcnt > 0) {
            if (nRowcnt >= 999) {
                alert("품목정보는 999개를 넘을 수 없습니다.!!");
                return;
            }

            vShipreq = this.ds_Detail.getColumn(0, "SHIPREQ");

            vItnbr = this.ds_Detail_1.getColumn(nRowcnt - 1, "ITNBR");
            vOut_gu = this.ds_Detail_1.getColumn(nRowcnt - 1, "OUT_GU");

            vDepot_no = this.ds_Detail_1.getColumn(nRowcnt - 1, "DEPOT_NO");
            vSugugb = this.ds_Detail_1.getColumn(nRowcnt - 1, "SUGUGB");
            vPangb = this.ds_Detail_1.getColumn(nRowcnt - 1, "PANGB");

            if (NXCore.isEmpty(vItnbr) || vItnbr == '') {
                alert("품번을 입력하세요.");
                this.gf_cursor_setting(this.Tab00.tabpage2.grd_Detail_1, nRowcnt - 1, 'ITNBR');
                return;
            }

            if (NXCore.isEmpty(vOut_gu) || vOut_gu == '') {
                alert("수불구분을 입력하세요!");
                this.gf_cursor_setting(this.Tab00.tabpage2.grd_Detail_1, nRowcnt - 1, 'OUT_GU');
                return;
            }

            if (vOut_gu != "O18" && vOut_gu != "O19" && vOut_gu != "OA1") {
                nPrc = this.ds_Detail_1.getColumn(nRowcnt - 1, "PIPRC");

                if (NXCore.isEmpty(nPrc) || nPrc == '' || nPrc == 0) {
                    alert("주문단가를 입력하세요.");
                    this.gf_cursor_setting(this.Tab00.tabpage2.grd_Detail_1, nRowcnt - 1, 'PIPRC');
                    return;
                }
            }
        }

        nIns = this.ds_Detail_1.addRow();

        if (nRowcnt > 0) {
            this.ds_Detail_1.setColumn(nIns, "DEPOT_NO", vDepot_no);
        }
        else {
            this.ds_Detail_1.setColumn(nIns, "DEPOT_NO", 'ZA161');
        }

        this.ds_Detail_1.setColumn(nIns, "CUST_NAPGI", vShipreq);
        this.ds_Detail_1.setColumn(nIns, "OUT_GU", vOut_gu);
        this.ds_Detail_1.setColumn(nIns, "SUJU_STS", '1');
        this.ds_Detail_1.setColumn(nIns, "ORDER_PSPEC", '.');
        this.ds_Detail_1.setColumn(nIns, "SUGUGB", '1');
        this.ds_Detail_1.setColumn(nIns, "PANGB", '1');
        this.ds_Detail_1.setColumn(nIns, "AMTGU", 'Y');
        this.ds_Detail_1.setColumn(nIns, "PISTS", '1');

        this.gf_cursor_setting(this.Tab00.tabpage2.grd_Detail_1, nIns, 'ITNBR');
    }
    else if (vi_Tabindex == 2) {
        if (NXCore.isEmpty(vs_Orderno) || vs_Orderno == '') {
            this.gf_message_chk("102329", ""); // 일반정보가 먼저 저장이 되어야 합니다.
            return;
        }
        var vn_Row = this.ds_Detail_2.addRow();
        this.gf_cursor_setting(this.grd_Detail_2, vn_Row, 'CHRGU');
    }
}

// 삽입
this.btn_insert_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vCvcod, vShipreq, vCnfdat, vPists, vPino;
    var vItnbr, vOut_gu, vDepot_no, vSugugb, vPangb;
    var nRowcnt = 0, nQty = 0, nPrc = 0, nOrder_qty = 0;
    var nIns = 0;

    vCvcod = this.ds_Head.getColumn(0, "ARG_CVCOD");
    vCnfdat = this.ds_Head.getColumn(0, "ORDCFDT");
    vPists = this.ds_Head.getColumn(0, "PISTS");

    var vi_Tabindex = this.Tab00.tabindex;

    if (vi_Tabindex == 1) {
        nRowcnt = this.ds_Detail_1.rowcount;

        if (nRowcnt > 0) {
            if (nRowcnt >= 999) {
                alert("품목정보는 999개를 넘을 수 없습니다.!!");
                return;
            }

            vShipreq = this.ds_Detail.getColumn(0, "SHIPREQ");

            vItnbr = this.ds_Detail_1.getColumn(nRowcnt - 1, "ITNBR");
            vOut_gu = this.ds_Detail_1.getColumn(nRowcnt - 1, "OUT_GU");

            vDepot_no = this.ds_Detail_1.getColumn(nRowcnt - 1, "DEPOT_NO");
            vSugugb = this.ds_Detail_1.getColumn(nRowcnt - 1, "SUGUGB");
            vPangb = this.ds_Detail_1.getColumn(nRowcnt - 1, "PANGB");

            if (NXCore.isEmpty(vItnbr) || vItnbr == '') {
                alert("품번을 입력하세요.");
                this.gf_cursor_setting(this.Tab00.tabpage2.grd_Detail_1, nRowcnt - 1, 'ITNBR');
                return;
            }

            if (NXCore.isEmpty(vOut_gu) || vOut_gu == '') {
                alert("수불구분을 입력하세요!");
                this.gf_cursor_setting(this.Tab00.tabpage2.grd_Detail_1, nRowcnt - 1, 'OUT_GU');
                return;
            }

            if (vOut_gu != "O18" && vOut_gu != "O19" && vOut_gu != "OA1") {
                nPrc = this.ds_Detail_1.getColumn(nRowcnt - 1, "PIPRC");

                if (NXCore.isEmpty(nPrc) || nPrc == '' || nPrc == 0) {
                    alert("주문단가를 입력하세요.");
                    this.gf_cursor_setting(this.Tab00.tabpage2.grd_Detail_1, nRowcnt - 1, 'PIPRC');
                    return;
                }
            }
        }

        nIns = this.ds_Detail_1.insertRow(this.ds_Detail_1.rowposition + 1);

        if (nRowcnt > 0) {
            this.ds_Detail_1.setColumn(nIns, "DEPOT_NO", vDepot_no);
        }
        else {
            this.ds_Detail_1.setColumn(nIns, "DEPOT_NO", 'ZA161');
        }

        this.ds_Detail_1.setColumn(nIns, "CUST_NAPGI", vShipreq);
        this.ds_Detail_1.setColumn(nIns, "OUT_GU", vOut_gu);
        this.ds_Detail_1.setColumn(nIns, "SUJU_STS", '1');
        this.ds_Detail_1.setColumn(nIns, "ORDER_PSPEC", '.');
        this.ds_Detail_1.setColumn(nIns, "SUGUGB", '1');
        this.ds_Detail_1.setColumn(nIns, "PANGB", '1');
        this.ds_Detail_1.setColumn(nIns, "AMTGU", 'Y');

        this.gf_cursor_setting(this.Tab00.tabpage2.grd_Detail_1, nIns, 'ITNBR');
    }
    else if (vi_Tabindex == 2) {
        if (NXCore.isEmpty(vs_Orderno) || vs_Orderno == '') {
            this.gf_message_chk("102329", ""); // 일반정보가 먼저 저장이 되어야 합니다.
            return;
        }
        var vn_Row = this.ds_Detail_2.addRow();
        this.gf_cursor_setting(this.grd_Detail_2, vn_Row, 'CHRGU');
    }
}

// 삭제
this.btn_delete_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vi_Tabindex = this.Tab00.tabindex;
    var vMode, vPino;
    var vOrdno, vSuju_Sts, vPists, vChrgu;

    var vStatus;

    var vSql;
    var vRet;

    var nRtn;
    var nPiamt = 0;
    var nRowcnt1 = 0, nRowcnt2 = 0, nRow = 0;

    vMode = input_Mode;
    vPino = this.ds_Head.getColumn(0, "ARG_ORDERNO");
    vPists = this.ds_Head.getColumn(0, "PISTS");

    if (vi_Tabindex == 0) {
        nRowcnt1 = this.ds_Detail.rowcount;

        if (input_Mode == 'I') return;


        if (NXCore.isEmpty(vPino) || vPino == '') {
            this.gf_message_chk("100162", ""); //PI 번호가 없습니다.
            return;
        }
        if (vPists >= '2') {
            this.gf_message_chk("102263", ""); //이미 진행된 PI 건으로 삭제 할 수 없습니다.
            return;
        }

        // PI에 연결되어 있는 LC 확인
        vs_Sql = "SELECT COUNT(*) AS CNT FROM EXPLCPI WHERE ORDER_NO LIKE '" + vPino + "'";
        this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT", "ff_Callback_sync");

        if (vi_ErrorCode < 0) return;
        if (this.ds_Temp.getColumn(0, 'CNT') > 0) {
            this.gf_message_chk("102175", ""); //이미 LC자료가 등록되어 삭제할 수 없습니다.
            return;
        }

        if (!this.gf_message_chk("1110", "P/I No. :" + vPino)) return;

        //일반정보에서 삭제시 품목 정보및 해당 Pi에 해당 되는 데이터 전부 삭제
        vs_Sql = "DELETE FROM SORDER WHERE ORDER_NO LIKE '" + vPino + "'||'%' AND OVERSEA_GU = '2'";
        vs_Sql += " @#$ DELETE FROM EXPPIH WHERE ORDER_NO = '" + vPino + "' ";
        vs_Sql += " @#$ DELETE FROM EXPPICH WHERE ORDER_NO = '" + vPino + "' ";

        this.gf_UpdateSql_sync(vs_Sql, 'DELETE_PI', "ff_Callback_sync", 0);

        this.ff_load();
        this.div_Input_Mode.btn_Input_onclick();
    }
    else if (vi_Tabindex == 1) {
        if (this.ds_Detail_1.rowcount <= 0) return;

        if (vPists != '1') {
            this.gf_message_chk("100165", ""); //PI 상태가 견적일 경우만 삭제 가능합니다.
            return;
        }

        nRow = this.ds_Detail_1.rowposition;

        vStatus = this.ds_Detail_1.getRowType(nRow);

        if (vStatus == "2") //// 신규
        {

            this.ds_Detail_1.deleteRow(nRow);

            return;
        }

        nRtn = this.ff_SujuSts(this.ds_Detail_1, nRow);

        if (nRtn != 0) {
            return;
        }

        nRowcnt2 = this.ds_Detail_1.rowcount;

        vOrdno = this.ds_Detail_1.getColumn(nRow, "ORDER_NO");
        vSuju_Sts = this.ds_Detail_1.getColumn(nRow, "SUJU_STS");

        if (vSuju_Sts >= "2") {
            alert("이미 진행된 PI건으로 삭제할 수 없습니다.");
            return;
        }

        if (application.confirm("삭제 하시겠습니까?") == false) {
            return;
        }

        var nSum_piamt = this.Tab00.tabpage2.grd_Detail_1.getSummValue(10);//9
        var nRow_piamt = this.ds_Detail_1.getColumn(nRow, "PIAMT");
        nSum_piamt = nSum_piamt - nRow_piamt;

        this.ds_Detail.setColumn(0, "OLD_PIAMT", nSum_piamt);
        this.ds_Detail.setColumn(0, "PIAMT", nSum_piamt);

        this.ds_Detail_1.deleteRow(nRow);

        vSql = "DELETE HOLDSTOCK WHERE ORDER_NO = '" + vOrdno + "'";

        this.gf_UpdateSql_sync(vSql, 'UPDATE_SQL', "ff_Callback_sync", 0);

        this.ff_Tran("SAVE_MASTER");
    }
    else if (vi_Tabindex == 2) {
        nRow = this.ds_Detail_2.rowposition;

        if (nRow < 0) {
            return;
        }

        vStatus = this.ds_Detail_2.getRowType(nRow);

        if (vStatus == "2") //// 신규일 경우
        {
            this.ds_Detail_2.deleteRow(nRow);
            return;
        }


        vPino = this.ds_Detail_2.getColumn(nRow, "ORDER_NO");
        vChrgu = this.ds_Detail_2.getColumn(nRow, "CHRGU");

        vRet = this.gf_SelectSql_sync("ds_Temp: SELECT nvl(count(*), 0) "
            + " FROM EXPCICH            "
            + " WHERE ORDER_NO = '" + vPino + "' "
            + "   AND CHRGU    = '" + vChrgu + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

        if (vRet[1] > 0) {
            alert("Ci Charge에서 사용중인 자료는 삭제하실 수 없습니다");
            return;
        }

        if (application.confirm("삭제 하시겠습니까?") == false) {
            return;
        }

        this.ds_Detail_2.deleteRow(nRow);

        //-------------------------------------------
        //-------------------------------------------
        this.ff_SetPiamt();

        nPiamt = this.ds_Detail.getColumn(0, "PIAMT");

        vSql = " UPDATE EXPPIH "
            + "    SET PIAMT   =  " + nPiamt + "  "
            + " WHERE ORDER_NO = '" + vPino + "' "

        this.gf_UpdateSql_sync(vSql, 'UPDATE_SQL', "ff_Callback_sync", 0);

        this.ff_Tran("SAVE_MASTER");
    }
}

// 저장
this.btn_save_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vs_Chkyn = 'N';
    if (NXCore.isModified(this.ds_Head)) vs_Chkyn = 'Y';	//변경된 자료 있음
    if (NXCore.isModified(this.ds_Detail)) vs_Chkyn = 'Y';	//변경된 자료 있음
    if (NXCore.isModified(this.ds_Detail_1)) vs_Chkyn = 'Y';	//변경된 자료 있음
    if (NXCore.isModified(this.ds_Detail_2)) vs_Chkyn = 'Y';	//변경된 자료 있음

    if (vs_Chkyn == 'N') {
        this.gf_message_chk("291", "");  //alert("변경된 자료가 없습니다.");
        return;
    }

    var vs_Sdate, vs_Orderno, vs_Localyn, vs_Cnfdate, vs_Pists, vs_Cvcod, vs_Saupj;
    var vs_Pono, vs_Cunit, vs_Empid, vs_Outsaupj, vs_Custnapgi, vs_Cust_no;
    var vs_Jpno, vn_Seq, vs_Sql;
    var i;

    if (this.fn_checkdata() == true) {
        if (this.ff_save_qty_chk() == 'N') {
            return;
        }
    }

    if (!this.ff_required_chk(input_Mode)) return;   // 에러 발생시 리턴

    if (this.gf_message_chk("1120", "") == 1) {	// Msg : 저장 하시겠습니까?
        vs_Sdate = this.ds_Head.getColumn(0, "ARG_SDATE");
        vs_Localyn = this.ds_Head.getColumn(0, "LOCALYN");
        vs_Cnfdate = this.ds_Head.getColumn(0, "ORDCFDT");
        vs_Pists = this.ds_Head.getColumn(0, "PISTS");
        vs_Cvcod = this.ds_Head.getColumn(0, "ARG_CVCOD");
        vs_Saupj = this.ds_Head.getColumn(0, "ARG_SAUPJ");
        if (NXCore.isEmpty(this.ds_Head.getColumn(0, "ARG_ORDERNO"))) {
            vs_Orderno = vs_Sdate + this.gf_get_junpyo(vs_Sdate, "S0");
            this.ds_Head.setColumn(0, "ARG_ORDERNO", vs_Orderno);
        }
        else {
            vs_Orderno = this.ds_Head.getColumn(0, "ARG_ORDERNO");
        }
        ///품목구분 최종 체크		
        if (!NXCore.isEmpty(this.ds_Detail.getColumn(0, "FACTORY")))//품목구분not null 일때 체크.
        {
            var vs_masittyp = this.ds_Detail.getColumn(0, "FACTORY");
            for (var j = 0; j < this.ds_Detail_1.rowcount; j++) {
                if (this.ds_Detail_1.getColumn(j, "ITTYP") != vs_masittyp) {
                    alert(j + 1 + "행의 품목구분이 해당 주문 건과 맞지 않습니다. \n품목 삭제 후 저장해주세요.");
                    return;
                }
            }
        }

        //일반정보 기본값 입력
        this.ds_Detail.setColumn(0, "PIAMT", this.Tab00.tabpage2.grd_Detail_1.getSummValue(10));//9
        this.ds_Detail.setColumn(0, "SAUPJ", vs_Saupj);
        this.ds_Detail.setColumn(0, "CVCOD", vs_Cvcod);
        this.ds_Detail.setColumn(0, "LOCALYN", vs_Localyn);
        this.ds_Detail.setColumn(0, "ORDCFDT", vs_Cnfdate);
        this.ds_Detail.setColumn(0, "PIDATE", vs_Sdate);
        this.ds_Detail.setColumn(0, "PISTS", vs_Pists);
        this.ds_Detail.setColumn(0, "ORDER_NO", vs_Orderno);

        vs_Pono = this.ds_Detail.getColumn(0, "PONO");
        vs_Cunit = this.ds_Detail.getColumn(0, "TUNCU");
        vs_Empid = this.ds_Detail.getColumn(0, "EMP_ID");
        vs_Custnapgi = this.ds_Detail.getColumn(0, "SHIPREQ");
        vs_Cust_no = this.ds_Detail.getColumn(0, "CUST_NO");


        // 품목 정보에서 신규 추가된 데이터 수주번호 입력
        vs_Sql = "SELECT NVL(max(substr(ORDER_NO, 13, 3)),0) AS SEQ  FROM SORDER  "
        vs_Sql += " WHERE ORDER_NO LIKE '" + vs_Orderno + "'||'%' ";

        this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT_SEQ", "ff_Callback_sync");

        if (vi_ErrorCode < 0) return;


        if (this.ds_Temp.rowcount == 0) {
            vn_Seq = 0;
        }
        else {
            vn_Seq = parseInt(this.ds_Temp.getColumn(0, "SEQ"));
        }

        if (this.ds_Detail_1.rowcount > 0) {
            //품목정보 입력			
            for (i = 0; i < this.ds_Detail_1.rowcount; i++) {
                //추가 수정 된 행만 검색 해서 처리 함, (모든 행에 대해서 For문 전체 처리 안해도 됨)
                vi_Row = this.ds_Detail_1.findRowExpr("(this.getRowType(rowidx)==4)||(this.getRowType(rowidx)==2)", i);
                if (vi_Row < 0) break;
                i = vi_Row;

                if (this.ds_Detail_1.getRowType(i) == 2) {
                    vn_Seq = vn_Seq + 1;
                    this.ds_Detail_1.setColumn(i, "ORDER_NO", vs_Orderno + this.gf_NumToStr(vn_Seq, 3));
                    this.ds_Detail_1.setColumn(i, "CRT_USER", application.gvs_empid);
                }
                else {
                    this.ds_Detail_1.setColumn(i, "UPD_USER", application.gvs_empid);
                }
                this.ds_Detail_1.setColumn(i, "ORDER_DATE", vs_Sdate);  //// 수주일자
                this.ds_Detail_1.setColumn(i, "CVCOD", vs_Cvcod);	//// 거래처
                this.ds_Detail_1.setColumn(i, "CV_ORDER_NO", vs_Pono);	//// 업체발주번호
                this.ds_Detail_1.setColumn(i, "OVERSEA_GU", '2');
                this.ds_Detail_1.setColumn(i, "ORDER_PSPEC", '.');
                this.ds_Detail_1.setColumn(i, "TUNCU", vs_Cunit);
                this.ds_Detail_1.setColumn(i, "EMP_ID", vs_Empid);
                this.ds_Detail_1.setColumn(i, "SUJU_STS", vs_Pists);
                this.ds_Detail_1.setColumn(i, "SAUPJ", vs_Saupj);
                this.ds_Detail_1.setColumn(i, "CUST_NAPGI", vs_Custnapgi);	//// 요구납기
                this.ds_Detail_1.setColumn(i, "CUST_NO", vs_Cust_no);
                this.ds_Detail_1.setColumn(i, "HOLD_QTY", 0);
                this.ds_Detail_1.setColumn(i, "INVOICE_QTY", 0);
                this.ds_Detail_1.setColumn(i, "OUT_QTY", 0);
                this.ds_Detail_1.setColumn(i, "CIQTY", 0);
            }

        }
        //Charge 입력			
        if (this.ds_Detail_2.rowcount > 0) {
            for (i = 0; i < this.ds_Detail_2.rowcount; i++) {
                if (this.ds_Detail_2.getRowType(i) == 2 || this.ds_Detail_2.getRowType(i) == 4) {
                    this.ds_Detail_2.setColumn(i, "ORDER_NO", vs_Orderno);
                }
            }
        }
        this.ff_Tran("SAVE_MASTER");
    }
    else {
        return;
    }

}

//취소 
this.btn_cancel_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    this.ff_load();
    this.div_Input_Mode.btn_Input_onclick();
}

// 닫기
this.btn_close_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    this.gf_closeMenu();
}

//--------------------------------------------------------------------
// 엑셀변환 버튼 클릭
//--------------------------------------------------------------------
this.btn_excel_chg_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    if (this.ds_Detail_1.rowcount < 1) return;
    this.gf_excel_download(this.Tab00.tabpage2.grd_Detail_1);
}

this.btn_excel_up_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vs_openRetv = 'Y';
    var vs_args = '';
    var vi_Tabindex = this.Tab00.tabindex;

    if (vi_Tabindex != 1) return;

    // 엑셀등록 양식을 다운 받겠습니까?
    /*if (this.gf_message_chk("121924", "") == 1)
    {
        vs_openRetv = 'N';
        this.gf_excel_download(this.Tab00.tabpage2.grd_Excel);
    }*/

    var vPidate = this.ds_Head.getColumn(0, "ARG_SDATE");          //// P/I발행일자
    var vPino = this.ds_Head.getColumn(0, "ARG_ORDERNO");

    var vArgspro = "10" + "|" + vPidate + "|" + vPino;

    var nRtn = this.gf_Procedure_sync("erp100000040", vArgspro, "PROCEDURE", "ff_Callback_sync", 0);

    var vCvcod = this.ds_Head.getColumn(0, "ARG_CVCOD");           ///// Buyer(거래처 코드)
    var vEmp_id = this.ds_Detail.getColumn(0, "EMP_ID");       //// 영업담당자
    var vCurr = this.ds_Detail.getColumn(0, "TUNCU");        //// 통화단위

    var vShipreq = this.ds_Detail.getColumn(0, "SHIPREQ");     //// 선적요구일

    var vCnfdat = this.ds_Head.getColumn(0, "ORDCFDT");
    var vPists = this.ds_Head.getColumn(0, "PISTS");

    var vSaupj = this.ds_Head.getColumn(0, "ARG_SAUPJ");

    if (NXCore.isEmpty(vSaupj) || vSaupj == '') {
        alert("사업장이 없습니다.");
        this.div_Head.cbo_Saupj.setFocus();
        return;
    }

    //----------------------------------------------------------
    //----------------------------------------------------------
    if (vPists != "1") {
        alert("PI 상태가 견적일 경우만 추가 가능합니다.")
        return;
    }

    //-----------------------------------------------------------
    //// 필수 입력 사항 check
    //-----------------------------------------------------------
    if (NXCore.isEmpty(vPidate) || vPidate == '') {
        alert("발행일을 입력하세요.");
        this.div_Head.cal_Sdate.setFocus();
        return;
    }
    else {
        if (this.gf_datecheck(vPidate) != 1) {
            alert("발행일이 일자형식이 아닙니다.");
            this.div_Head.cal_Sdate.setFocus();
            return;
        }
    }

    if (NXCore.isEmpty(vCvcod) || vCvcod == '') {
        alert("Buyer 를 입력하세요.")
        this.div_Head.edt_Cvcod.setFocus();
        return;
    }

    if (NXCore.isEmpty(vEmp_id) || vEmp_id == '') {
        alert("영업담당자를 를 입력하세요.")
        this.Tab00.tabpage1.Div_Detail.edt_emp_id.setFocus();
        return;
    }

    if (NXCore.isEmpty(vCurr) || vCurr == '') {
        alert("통화단위를 입력하세요.")
        this.Tab00.tabpage1.Div_Detail.cbo_Cunit.setFocus();
        return;
    }

    if (NXCore.isEmpty(vShipreq) || vShipreq == '') {
        alert("선적요구일을 입력하세요.");
        this.Tab00.tabpage1.Div_Detail.cal_Shipreq.setFocus();
        return;
    }
    else {
        if (this.gf_datecheck(vPidate) != 1) {
            alert("선적요구일이 일자형식이 아닙니다.");
            this.Tab00.tabpage1.Div_Detail.cal_Shipreq.setFocus();
            return;
        }
    }

    var vs_args = this.gf_get_trans_word(" ◎ 항목설명") + "\n"
        + this.gf_get_trans_word("	1. No. : 순번(입력 불필요)") + "\n"
        + this.gf_get_trans_word("	2. 형번,단가,수량,비고 : 입력") + "\n"
        + "\n"
        + this.gf_get_trans_word(" ◎ 주의사항") + "\n"
        + this.gf_get_trans_word("	1. 엑셀 양식을 임의로 변경불가(항목 삭제/추가 불가)");

    var resultForm = this.gf_showPopup("popup_excel_upload", "co_popu::co_popu_excelupload_ex.xfdl", { width: 10, height: 20 },
        {
            OpenRetv: vs_openRetv,	// popup 즉시 파일찾기
            Argument: vs_args  		// 조회조건 파라메터 
        }, { callback: "ff_AfterPopup" });
}

// B/O 등록
this.btn_etc1_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vSts, vBordno, vSql, vSql2, vRtn, vCnt;
    var Userid = application.gvs_userid;

    if (application.confirm(" BACK ORDER 생성합니다.\n 기존에 이미 작성한 BACK ORDER 가 있으면 삭제한 후 재작성합니다.\n 계속하시겠습니까?") == false) return;

    vCnt = 0;
    for (i = 0; i <= this.ds_Detail_1.rowcount - 1; i++) {
        if (this.ds_Detail_1.getColumn(i, "ORD_CANCEL_QTY") != 0) vCnt++;
    }

    if (vCnt < 1) {
        alert(" 작성 대상 BACK ORDER 수량이 없습니다.");
        return;
    }

    vCnt = 0;
    for (i = 0; i <= this.ds_Detail_1.rowcount - 1; i++) {
        vSts = this.ds_Detail_1.getRowType(i);
        vBordno = this.ds_Detail_1.getColumn(i, "BACKORDNO");

        if (this.fn_checkdata() == true)
        //if (vSts != '1') 
        {
            alert(" 저장되지 않은 자료가 있습니다. 저장 후 다시 작업하세요.")
            return;
        }

        if (!NXCore.isEmpty(vBordno) && vBordno != '') {

            vRtn = this.gf_SelectSql_sync("ds_Temp: Select count(*) from sorder where order_no like '" + vBordno + "%' and suju_sts > '6' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
            if (vRtn[1] > 1) {
                alert(" 이미 작성한 BACK ORDER 가 진행된 사항이 있어 재작성 불가합니다.");
                return;
            }

            vCnt++;

            if (vCnt == 1) {
                vSql = "Delete exppih where order_no = '" + vBordno.substr(0, 12) + "'";
                this.gf_UpdateSql_sync(vSql, 'UPDATE_SQL', "ff_Callback_sync", 0);

                vSql2 = "Delete sorder where order_no like '" + vBordno.substr(0, 12) + "%'";
                this.gf_UpdateSql_sync(vSql2, 'UPDATE_SQL', "ff_Callback_sync", 0);
            }
        }
    }

    var vPidate = this.ds_Head.getColumn(0, "ARG_SDATE");
    var vSeq = this.gf_get_junpyo(vPidate, "S0");

    if (NXCore.isEmpty(vSeq) || vSeq == '') {
        alert(" 전표번호 채번 오류!");
        return;
    }

    var vBackord;
    var vBordno = vPidate + vSeq;   		//// PI번호(주문일자 + 일련번호
    var vOrdno = this.ds_Head.getColumn(0, "ARG_ORDERNO");

    var vSql = "insert into exppih "
        + "select '" + vBordno + "', pidate, '1', cvcod, localyn, factory, piattn, areacd, pifrom, pimaker, origin, "
        + "	   terms, payment, invafternego, packing, shipreq, shipsch, invsch, commission, agent, pisangho, "
        + "       piaddr, pinotes, caseinfo, delivery_terms, shipment, inspection, validity, trans, tuncu,"
        + "       emp_id, wrate, urate, wamt, uamt, piamt, ciamt, ngamt, pono, ordcfdt, saupj, '', banknm, "
        + "       accno, accnm, swiftcode, bankaddr, semno "
        + "  from exppih "
        + " where order_no = '" + vOrdno + "'";

    this.gf_UpdateSql_sync(vSql, 'UPDATE_SQL', "ff_Callback_sync", 0);

    var nBoqty;
    for (i = 0; i <= this.ds_Detail_1.rowcount - 1; i++) {
        nBoqty = this.ds_Detail_1.getColumn(i, "ORD_CANCEL_QTY");
        if (nBoqty == 0) continue;

        vOrdno = this.ds_Detail_1.getColumn(i, "ORDER_NO");
        var Reqty = this.ds_Detail_1.getColumn(i, "JISI_QTY");
        var Allowqty = this.ds_Detail_1.getColumn(i, "PROD_QTY");

        if (NXCore.isEmpty(Allowqty) || Allowqty == '') {
            Allowqty = 0
        }

        var Shortageqty = nexacro.round(Reqty - Allowqty, 0);
        var Boqty = this.ds_Detail_1.getColumn(i, "ORD_CANCEL_QTY");
        var Bigo = this.ds_Detail_1.getColumn(i, "MISAYU");

        vBackord = vBordno + vOrdno.substr(12, 3);
        this.ds_Detail_1.setColumn(i, "PROJECT_NO", vBackord);

        var vSql = "Insert into sorder "
            + "Select '" + vBackord + "', order_date, cvcod, cv_order_no, '', cust_no, out_gu, oversea_gu, emp_id, "
            + "       itnbr, order_pspec, " + nBoqty + ", order_prc, order_prc * " + nBoqty + ", dc_rate, cust_napgi, "
            + "       suju_sts, ord_ok_date, ord_cancel_date, 0, ord_cancel_cause, 0, 0, out_qty, " + nBoqty + ","
            + "      " + nBoqty + ", saupj, '', misayu, depot_no, sugugb, pangb, amtgu, seqno, deptno, tuncu, chng_prc,"
            + "       chng_amt, usdamt, order_memo, crt_date, crt_time, crt_user, upd_date, upd_time, upd_user, "
            + "       cidate, ciqty, piprc, piprc * " + nBoqty + ", in_depot_no, ji_empno, pkgno, con_cvcod, rcv_gubun, sarea, "
            + "       crt_pgmid, unprc, vatamt, gwdat, gwsts, gwgbn, dangbn, giftno, giftno_seqno, semno, estno,''  "
            + "  from sorder "
            + " where order_no = '" + vOrdno + "'";

        this.gf_UpdateSql_sync(vSql, 'UPDATE_SQL', "ff_Callback_sync", 0);

        vSql = "Insert into backorder(backordno, order_no, reqty, allowqty, shortageqty, boqty, bigo, crt_user) "
            + "           values('" + vBackord + "', '" + vOrdno + "',  " + Reqty + ", " + Allowqty + ", " + Shortageqty + "," + Boqty + ", '" + Bigo + "', '" + Userid + "') ";

        this.gf_UpdateSql_sync(vSql, 'UPDATE_SQL', "ff_Callback_sync", 0);
    }

    var vSql = "update exppih a set piamt = (select sum(piamt) from sorder where order_no like a.order_no||'%') "
        + " where a.order_no = '" + vBackord.substr(0, 12) + "'";

    this.gf_UpdateSql_sync(vSql, 'UPDATE_SQL', "ff_Callback_sync", 0);

    this.ff_Tran("SAVE_MASTER");
}
// 재고조회
this.btn_etc2_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vPino, vPists, vSts, i;
    vPino = this.ds_Head.getColumn(0, "ARG_ORDERNO");
    vPists = this.ds_Detail_1.getColumn(0, "PISTS");
    vSjsts = this.ds_Detail_1.getColumn(0, "SUJU_STS");

    if (vSjsts >= '6') {
        alert(" 창고에서 출고준비가 완료되어 재고조회 할 수 없습니다.");
        return;
    }

    if (vPists == 'R') {
        alert(" 이미 재고 확인 요청 중입니다.");
        return;
    }

    if (vPists == 'Y') {
        if (application.confirm(" 이미 재고 확인이 완료된 상태입니다.\n 다시 요청하시겠습니까?") == false) return;
    }

    for (i = 0; i <= this.ds_Detail_1.rowcount - 1; i++) {
        vSts = this.ds_Detail_1.getRowType(i);

        if (this.fn_checkdata() == true) {
            alert(" 저장되지 않은 자료가 있습니다. 저장 후 요청하세요.");
            return;
        }
    }

    if (application.confirm(" 물류부에 재고 확인 요청합니다.\n 확인 결과가 등록될 때 까지 수량은 수정할 수 없습니다\n 계속하시겠습니까?") == false) return;

    var nJisi_qty, nPiprc, nPiamt;
    for (i = 0; i <= this.ds_Detail_1.rowcount - 1; i++) {
        nPiprc = this.ds_Detail_1.getColumn(i, "PIPRC");
        nJisi_qty = this.ds_Detail_1.getColumn(i, "PROD_QTY");
        nPiamt = nPiprc * nJisi_qty;

        this.ds_Detail_1.setColumn(i, "ORD_CANCEL_QTY", 0);
        this.ds_Detail_1.setColumn(i, "ORDER_QTY", nJisi_qty);
        this.ds_Detail_1.setColumn(i, "PIAMT", nPiamt);
    }

    var vSql = " UPDATE EXPPIH "
        + "    SET CHK = 'R' "
        + " WHERE ORDER_NO = '" + vPino + "'";

    this.gf_UpdateSql_sync(vSql, 'UPDATE_SQL', "ff_Callback_sync", 0);


    vSql = " UPDATE SORDER "
        + "    SET PROD_QTY = 0, ORD_CANCEL_QTY = 0, HOLD_QTY = 0, INVOICE_QTY = 0, OUT_QTY = 0, CIQTY = 0 "
        + " WHERE ORDER_NO LIKE '" + vPino + "%'";

    this.gf_UpdateSql_sync(vSql, 'UPDATE_SQL', "ff_Callback_sync", 0);

    this.ff_Tran("SAVE_MASTER");

    //alert(" 요 청 완 료!");
    return;
}

// CANCEL
this.btn_etc3_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vMode, vPino, vPists, vOrdno;
    var i = 0, nRowcnt2 = 0;

    var vSql;
    var vRet, vRet2, vRet3;

    vMode = input_Mode;
    vPino = this.ds_Head.getColumn(0, "ARG_ORDERNO");
    vPists = this.ds_Head.getColumn(0, "PISTS");

    if (vMode == "I")   //// 등록모드일 경우에는 처리하지 못함
    {
        return;
    }

    nRowcnt2 = this.ds_Detail_1.rowcount;

    if (nRowcnt2 == 0) {
        return;
    }

    vRet = this.gf_SelectSql_sync("ds_Temp: SELECT nvl(count(*), 0) "
        + " FROM EXPCID             "
        + " WHERE ORDER_NO LIKE '" + vPino + "'||'%' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

    if (vRet[1] > 0) {
        alert("이미 CI 가 발행이 되어 취소할 수 없습니다.");
        return;
    }

    vRet2 = this.gf_SelectSql_sync("ds_Temp: SELECT nvl(count(*), 0) "
        + " FROM POBLKT             "
        + " WHERE ORDER_NO LIKE '" + vPino + "'||'%' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

    if (vRet2[1] > 0) {
        alert("진행중인 발주품목이 있어 취소할 수 없습니다.");
        return;
    }

    vRet3 = this.gf_SelectSql_sync("ds_Temp: SELECT nvl(count(*), 0) "
        + " FROM ESTIMA_COPY        "
        + " WHERE ORDER_NO LIKE '" + vPino + "'||'%' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);


    if (vRet3[1] > 0) {
        alert("진행중인 구매청구 품목이 있어 취소할 수 없습니다.");
        return;
    }

    if (application.confirm(" 해당 내역을 취소 하시겠습니까?") == false) {
        return;
    }

    this.ds_Detail.setColumn(0, "ORDCFDT", '');

    for (i = 0; i <= nRowcnt2 - 1; i++) {
        vOrdno = this.ds_Detail_1.getColumn(i, "ORDER_NO");

        ////----------------------------------
        //// 할당 삭제
        ////----------------------------------
        if (this.ff_HoldDel(vOrdno) == -1) {
            return;
        }

        var vSql = " UPDATE SORDER            "
            + "   SET SUJU_STS = '4',    "
            + "       ORD_OK_DATE = '' "
            + " WHERE ORDER_NO = '" + vOrdno + "' ";

        this.gf_UpdateSql_sync(vSql, 'UPDATE_SQL', "ff_Callback_sync", 0);

    }

    this.ds_Head.setColumn(0, "PISTS", '4');
    this.ds_Head.setColumn(0, "ORDCFDT", '');

    this.ds_Detail.setColumn(0, "PISTS", '4');
    this.ds_Detail.setColumn(0, "ORDCFDT", '');

    ////-------------------------
    //// PI 금액 처리
    ////-------------------------
    this.ff_SetPiamt();
    ////-------------------------
    //// HEADER UPDATE
    ////-------------------------


    vSql = " UPDATE EXPPIH          "
        + "    SET PISTS = '4',    "
        + "        ORDCFDT = '', "
        + "        PIAMT = 0       "
        + " WHERE ORDER_NO = '" + vPino + "' ";

    this.gf_UpdateSql_sync(vSql, 'UPDATE_SQL', "ff_Callback_sync", 0);

    ////------------
    //// 조회
    ////------------
    this.btn_query_onclick();
}

// 확정
this.btn_etc4_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vs_Arg;
    if (NXCore.isEmpty(this.ds_Head.getColumn(0, "ARG_ORDERNO"))) return;
    if (!(this.ds_Head.getColumn(0, "PISTS") == '1' || this.ds_Head.getColumn(0, "PISTS") == '3')) {
        this.gf_message_chk("100163", "");  //PI 상태가 '견적' 또는 '보류'일 경우에 확정처리가 가능합니다.
        return;
    }
    if (this.gf_message_chk("1950", "") == 1) {	// Msg : 확정 처리 하시겠습니까?
        vs_Arg = '';
        var resultForm = this.gf_showPopup("popup_confirm", "co_popu::co_popu_exppih_confirm_f.xfdl", { width: 10, height: 20 },
            {
                OpenRetv: 'N',   // popup open 즉시 조회  
                MultSelect: 'N',   // MULTI LINE 선택
                Argument: vs_Arg  // 조회조건 파라메터 
            }, { callback: "ff_AfterPopup" });
    }
}

// 해제
this.btn_etc5_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vMode, vPino, vPists, vOrdno;
    var i = 0, nRowcnt2 = 0;

    var vSql;
    var vRet, vRet2, vRet3;

    vMode = input_Mode;
    vPino = this.ds_Head.getColumn(0, "ARG_ORDERNO");
    vPists = this.ds_Head.getColumn(0, "PISTS");

    if (vMode == "I")   //// 등록모드일 경우에는 처리하지 못함
    {
        return;
    }

    nRowcnt2 = this.ds_Detail_1.rowcount;

    if (nRowcnt2 == 0) {
        return;
    }

    if (vPists != '2') {
        alert("PI 상태가 [확정] 일 경우에 해제 처리가 가능합니다.");
        return;
    }

    vRet = this.gf_SelectSql_sync("ds_Temp: SELECT COUNT(*) FROM SORDER WHERE PKGNO LIKE '" + vPino + "%'", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
    if (vRet[1] > 0) {
        alert(" 출고가 진행 중이라 해제할 수 없습니다. 출고요청을 삭제한 다음 처리하세요.");
        return;
    }

    vRet = this.gf_SelectSql_sync("ds_Temp: SELECT nvl(count(*), 0) "
        + " FROM EXPCID             "
        + " WHERE ORDER_NO LIKE '" + vPino + "'||'%'", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

    if (vRet[1] > 0) {
        alert("이미 CI 가 발행이 되어 해제할 수 없습니다.");
        return;
    }

    vRet2 = this.gf_SelectSql_sync("ds_Temp: SELECT nvl(count(*), 0) "
        + " FROM POBLKT             "
        + " WHERE ORDER_NO LIKE '" + vPino + "'||'%'", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

    if (vRet2[1] > 0) {
        alert("진행중인 발주품목이 있어 해제할 수 없습니다.");
        return;
    }

    vRet3 = this.gf_SelectSql_sync("ds_Temp: SELECT nvl(count(*), 0) "
        + " FROM ESTIMA_COPY        "
        + " WHERE ORDER_NO LIKE '" + vPino + "'||'%'", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

    if (vRet3[1] > 0) {
        alert("진행중인 구매청구 품목이 있어 해제할 수 없습니다.");
        return;
    }

    if (application.confirm("확정내역을 해제 하시겠습니까?") == false) {
        return;
    }

    this.ds_Detail.setColumn(0, "ORDCFDT", '');

    for (i = 0; i <= nRowcnt2 - 1; i++) {
        vOrdno = this.ds_Detail_1.getColumn(i, "ORDER_NO");

        ////----------------------------------
        //// 할당 삭제
        ////----------------------------------
        if (this.ff_HoldDel(vOrdno) == -1) {
            return;
        }

        var vSql = " UPDATE SORDER            "
            + "   SET SUJU_STS = '1',    "
            + "       ORD_OK_DATE = null "
            + " WHERE ORDER_NO = '" + vOrdno + "' ";

        this.gf_UpdateSql_sync(vSql, 'UPDATE_SQL', "ff_Callback_sync", 0);

    }

    this.ds_Head.setColumn(0, "PISTS", '1');
    this.ds_Head.setColumn(0, "ORDCFDT", '');

    this.ds_Detail.setColumn(0, "PISTS", '1');
    this.ds_Detail.setColumn(0, "ORDCFDT", '');

    ////-------------------------
    //// PI 금액 처리
    ////-------------------------
    this.ff_SetPiamt();

    ////-------------------------
    //// HEADER UPDATE
    ////-------------------------
    var vSql = " UPDATE EXPPIH          "
        + "    SET PISTS = '1',    "
        + "        ORDCFDT = null, "
        + "        PIAMT = 0       "
        + " WHERE ORDER_NO = '" + vPino + "' ";

    this.gf_UpdateSql_sync(vSql, 'UPDATE_SQL', "ff_Callback_sync", 0);

    ////------------
    //// 조회
    ////------------
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
    var vs_Data, vs_OldData;			//이벤트에서 데이터 값  
    var vs_Sql; 			//Sql의 값
    var vn_Row; 			// 해당 row 값  

    // dataset과 다른 object로 나눠서 처리 
    // obj를 dataset를 확인 해서 처리 함.	
    if (obj == '[object Dataset]') {
        vn_Row = e.row;
        vs_Data = e.newvalue;
        vs_OldData = e.oldvalue;
        // dataset 이름 별로 처리 
        if (obj.id == 'ds_Head') {
            switch (e.columnid) {
                case 'ARG_CVCOD':
                    if (NXCore.isEmpty(vs_Data)) {
                        this.div_Head.edt_Cvnas.set_value(null);
                        return;
                    }

                    vs_Sql = " SELECT CVNAS FROM VNDMST WHERE  CVCOD = '" + vs_Data + "' ";
                    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT_CVCOD", "ff_Callback_sync");

                    if (vi_ErrorCode < 0) return;

                    if (this.ds_Temp.rowcount == 0) {
                        this.div_Head.edt_Cvcod.set_value(null);
                        this.div_Head.edt_Cvnas.set_value(null);
                        this.Tab00.tabpage1.Div_Detail.edt_Napcvcod.set_value(null);
                        this.Tab00.tabpage1.Div_Detail.edt_Napcvnas.set_value(null);

                    }
                    else {
                        this.ds_Head.setColumn(0, "ARG_CVNAS", this.ds_Temp.getColumn(0, "CVNAS"));
                        this.ds_Detail.setColumn(0, "CUST_NO", vs_Data);
                        this.ds_Detail.setColumn(0, "NAPCVNAS", this.ds_Temp.getColumn(0, "CVNAS"));
                        if (input_Mode == 'I') {
                            vs_Sql = "SELECT PIATTN, PIFROM, TERMS, PAYMENT, COMMISSION, SHIPMENT, DELIVERY_TERMS,	FACTORY"
                                + " 		   VALIDITY, ORIGIN, PIMAKER, PISANGHO, PIADDR, PINOTES, PACKING, CASEINFO"//, TITLE, CUST_NO, FUN_GET_CVNAS(CUST_NO) AS NAPCVNAS,	VF_FROM, VF_TO"
                                + "	  FROM EXPPIH									"
                                + "  WHERE CVCOD = '" + vs_Data + "'		"
                                + "		 AND ORDER_NO = (SELECT MAX(ORDER_NO) FROM EXPPIH WHERE CVCOD = '" + vs_Data + "')";
                            this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "EXPPIH_SELECT", "ff_Callback_sync");
                            this.ds_Detail.set_enableevent(false);
                            if (this.ds_Temp.rowcount > 0) {
                                this.ds_Detail.setColumn(0, "PIATTN", this.ds_Temp.getColumn(0, "PIATTN"));
                                this.ds_Detail.setColumn(0, "PIFROM", this.ds_Temp.getColumn(0, "PIFROM"));
                                this.ds_Detail.setColumn(0, "TERMS", this.ds_Temp.getColumn(0, "TERMS"));
                                this.ds_Detail.setColumn(0, "PAYMENT", this.ds_Temp.getColumn(0, "PAYMENT"));
                                //								this.ds_Detail.setColumn(0, "COMMISSION", this.ds_Temp.getColumn(0,"COMMISSION"));
                                this.ds_Detail.setColumn(0, "SHIPMENT", this.ds_Temp.getColumn(0, "SHIPMENT"));
                                this.ds_Detail.setColumn(0, "DELIVERY_TERMS", this.ds_Temp.getColumn(0, "DELIVERY_TERMS"));
                                this.ds_Detail.setColumn(0, "VALIDITY", this.ds_Temp.getColumn(0, "VALIDITY"));
                                this.ds_Detail.setColumn(0, "ORIGIN", this.ds_Temp.getColumn(0, "ORIGIN"));
                                this.ds_Detail.setColumn(0, "PIMAKER", this.ds_Temp.getColumn(0, "PIMAKER"));
                                this.ds_Detail.setColumn(0, "PISANGHO", this.ds_Temp.getColumn(0, "PISANGHO"));
                                //this.ds_Detail.setColumn(0, "PIADDR", this.ds_Temp.getColumn(0,"PIADDR"));
                                this.ds_Detail.setColumn(0, "PINOTES", this.ds_Temp.getColumn(0, "PINOTES"));
                                this.ds_Detail.setColumn(0, "PACKING", this.ds_Temp.getColumn(0, "PACKING"));
                                this.ds_Detail.setColumn(0, "CASEINFO", this.ds_Temp.getColumn(0, "CASEINFO"));
                                //this.ds_Detail.setColumn(0, "TITLE", this.ds_Temp.getColumn(0,"TITLE"));
                                //this.ds_Detail.setColumn(0, "CUST_NO", this.ds_Temp.getColumn(0,"CUST_NO"));
                                //this.ds_Detail.setColumn(0, "NAPCVNAS", this.ds_Temp.getColumn(0,"NAPCVNAS"));
                                //this.ds_Detail.setColumn(0, "VF_FROM", this.ds_Temp.getColumn(0,"VF_FROM"));
                                //this.ds_Detail.setColumn(0, "VF_TO", this.ds_Temp.getColumn(0,"VF_TO"));
                                //this.ds_Detail.setColumn(0, "FACTORY", this.ds_Temp.getColumn(0,"FACTORY"));
                                this.ds_Detail.setColumn(0, "OUTSAUPJ", this.ds_Head.getColumn(0, "ARG_SAUPJ"));
                                this.ds_Detail.setColumn(0, "FACTORY", this.ds_Head.getColumn(0, "ARG_ITTYP"));//등록 모드 일때는 품목 셋팅

                                // 결제조건에 따른 일수지정
                                var vs_Sql1 = "";
                                vs_Sql1 += " SELECT A.RFNA2 AS ILSU, NVL(A.RFNA3,'Y') AS MOD       ";
                                vs_Sql1 += " FROM REFFPF A      ";
                                vs_Sql1 += " WHERE A.RFCOD = '52' AND A.RFGUB = '" + this.ds_Temp.getColumn(0, "PAYMENT") + "'   ";

                                this.gf_SelectSql_sync("ds_Temp : " + vs_Sql1, "SELECT_ILSU", "ff_Callback_sync");
                                if (vi_ErrorCode < 0) return;

                                if (this.ds_Temp.rowcount == 0) {
                                    this.ds_Detail.setColumn(0, 'COMMISSION', null);
                                    var vs_Mod = 'Y';
                                }
                                else {
                                    this.ds_Detail.setColumn(0, 'COMMISSION', this.ds_Temp.getColumn(0, "ILSU"));
                                    var vs_Mod = this.ds_Temp.getColumn(0, "MOD");
                                }

                                if (vs_Mod == 'Y') {
                                    //this.Tab00.tabpage1.Div_Detail.msk_Commission.set_enable(true);
                                }
                                else {
                                    //this.Tab00.tabpage1.Div_Detail.msk_Commission.set_enable(false);
                                }

                            }

                            this.ff_total_qty();

                            this.ds_Detail.set_enableevent(true);
                        }
                    }
                    break;

                case 'ARG_ITTYP':
                    if (NXCore.isEmpty(vs_Data) || vs_Data == '') {
                        vs_Data = '1'; //null데이터일 경우 제품으로 처리
                    }
                    if (input_Mode == 'I') {
                        this.ds_Detail.setColumn(0, 'FACTORY', vs_Data); // 등록 모드 일때만 변경 해줍니다.

                    }
                    break;
            }
        }
        else if (obj.id == 'ds_Detail') {
            switch (e.columnid) {
                case 'PAYMENT':
                    var vs_Sql = "";
                    vs_Sql += " SELECT A.RFNA2 AS ILSU, NVL(A.RFNA3,'Y') AS MOD       ";
                    vs_Sql += " FROM REFFPF A      ";
                    vs_Sql += " WHERE A.RFCOD = '52' AND A.RFGUB = '" + vs_Data + "'   ";

                    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT_ILSU", "ff_Callback_sync");
                    if (vi_ErrorCode < 0) return;

                    if (this.ds_Temp.rowcount == 0) {
                        this.ds_Detail.setColumn(0, 'COMMISSION', null);
                        var vs_Mod = 'Y';
                    }
                    else {
                        this.ds_Detail.setColumn(0, 'COMMISSION', this.ds_Temp.getColumn(0, "ILSU"));
                        var vs_Mod = this.ds_Temp.getColumn(0, "MOD");
                    }

                    if (vs_Mod == 'Y') {
                        //this.Tab00.tabpage1.Div_Detail.msk_Commission.set_enable(true);
                    }
                    else {
                        //this.Tab00.tabpage1.Div_Detail.msk_Commission.set_enable(false);
                    }

                    break;

                case "INSPECTION":
                    if (NXCore.isEmpty(vs_Data) || vs_Data == '') {
                        this.ds_Detail.setColumn(0, "INSPECTION", '100'); //null데이터일 경우 선택으로 돌아가도록..
                        return;
                    }

                    if (vs_Data == '99') {
                        this.Tab00.tabpage1.Div_Detail.cal_duedate.set_visible(true);
                        this.ds_Detail.setColumn(0, 'PIADDR', this.gf_today());
                    } else {
                        this.Tab00.tabpage1.Div_Detail.cal_duedate.set_visible(false);
                        this.ds_Detail.setColumn(0, 'PIADDR', '');
                    }

            }
        }
        else if (obj.id == 'ds_Detail_2') {
            switch (e.columnid) {
                case 'CHRAMT':
                    if (NXCore.isEmpty(vs_Data) || vs_Data == '') {
                        vs_Data = 0;
                    }

                    nWrate = this.ds_Detail.getColumn(0, "WRATE");
                    nUrate = this.ds_Detail.getColumn(0, "URATE");
                    nWeight = this.ds_Detail.getColumn(0, "WEIGHT");

                    if (NXCore.isEmpty(nWrate) || nWrate == '') {
                        nWrate = 0;
                    }

                    if (NXCore.isEmpty(nUrate) || nUrate == '') {
                        nUrate = 0;
                    }

                    if (NXCore.isEmpty(nWeight) || nWeight == '') {
                        nWeight = 0;
                    }

                    this.ds_Detail_2.setColumn(vn_Row, 'WAMT', nexacro.round((vData * nWrate) / nWeight, 0));
                    this.ds_Detail_2.setColumn(vn_Row, 'UAMT', nexacro.round((vData * nUrate) / nWeight, 2));

                    break;
            }
        }
        else if (obj.id == 'ds_Detail_1') {
            var nHoldQty = this.ff_SujuSts(this.ds_Detail_1, vn_Row);

            switch (e.columnid) {
                case 'ITNBR':

                    if (NXCore.isEmpty(vs_Data) || vs_Data == '') {
                        ////-----------------------
                        //// 품목 정보 clear....
                        ////-----------------------
                        this.ff_ClearItem(this.ds_Detail_1, vn_Row);
                        return;
                    }
                    var vs_ittyp = this.ds_Head.getColumn(0, "ARG_ITTYP");
                    var vs_ittypChk = '1';

                    if (NXCore.isEmpty(this.ds_Detail.getColumn(0, "FACTORY")) || this.ds_Detail.getColumn(0, "FACTORY") == '') {
                        vs_ittypChk = '0';
                    }

                    var vOpenSale = new Array();
                    vOpenSale[0] = 'ITEMAS';
                    vOpenSale[1] = vs_Data;
                    vOpenSale[2] = '1,7';  // 품목구분
                    vOpenSale[3] = 'Y';  // Y이면 검색시 POPUP을 자동으로 띄우고 N이면 POPUP을 안띄움
                    vOpenSale[4] = 'M';  // 선택기준 M:Multi, S:Single
                    vOpenSale[5] = '';

                    var vReturnSale = this.gfi_get_name_sale(vOpenSale);    // 찾지 못할경우에는 popup을 띠우기위한 array로 변환해온다. 

                    if (vReturnSale[99] == "POPUP") {
                        this.ff_itemas_f_pop("co_pop_itemas_4_detail_rbtn", vReturnSale);      // popup 을 띠움. 
                        return;
                    }
                    // 품목 단위 select 
                    var vs_unmsr = this.gf_SelectSql_sync("ds_Temp: Select UNMSR from itemas where itnbr = '" + vs_Data + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
                    vRet2 = this.gf_SelectSql_sync("ds_Temp: SELECT BUDSC "
                        + " FROM ITMBUY  "
                        + " WHERE ITNBR = '" + vs_Data + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
                    if (vs_ittypChk == '1') {
                        if (vs_ittyp != vReturnSale[6]) {
                            alert("제품/상품 구분이 맞지 않습니다.\n" + vs_Data + " 형번.");
                            this.ds_Detail_1.setColumn(vn_Row, 'ITNBR', '');
                            return;
                        }
                    }

                    if (vRet2[0] != 0) {
                        this.ds_Detail_1.setColumn(vn_Row, 'ITDSC', vRet2[1]);
                    }

                    this.ds_Detail_1.setColumn(vn_Row, "ITNBR", vReturnSale[1]);
                    this.ds_Detail_1.setColumn(vn_Row, "PRODNM", vReturnSale[2]);
                    this.ds_Detail_1.setColumn(vn_Row, "ITDSC", vReturnSale[3]);
                    this.ds_Detail_1.setColumn(vn_Row, "ISPEC", vReturnSale[4]);
                    this.ds_Detail_1.setColumn(vn_Row, "UNMSR", vs_unmsr[1]);
                    this.ds_Detail_1.setColumn(vn_Row, "ITTYP", vReturnSale[6]);
                    this.ds_Detail_1.setColumn(vn_Row, "CUST_NAPGI", this.ds_Detail.getColumn(0, "SHIPREQ"));
                    vPspec = this.ds_Detail_1.getColumn(vn_Row, "ORDER_PSPEC");
                    nQty = this.ds_Detail_1.getColumn(vn_Row, "ORDER_QTY");

                    if (NXCore.isEmpty(vPspec) || vPspec == '') // 사양 null일때 '.' 
                    {
                        this.ds_Detail_1.setColumn(vn_Row, "ORDER_PSPEC", '.');
                        vPspec = this.ds_Detail_1.getColumn(vn_Row, "ORDER_PSPEC");
                    }


                    ///--------------------------------------------
                    ///// 단가 clear 작업
                    ///--------------------------------------------
                    this.ds_Detail_1.setColumn(vn_Row, 'PIPRC', 0);
                    this.ds_Detail_1.setColumn(vn_Row, 'ORDER_PRC', 0);
                    this.ds_Detail_1.setColumn(vn_Row, 'ORDER_AMT', 0);
                    this.ds_Detail_1.setColumn(vn_Row, 'USDAMT', 0);
                    this.ds_Detail_1.setColumn(vn_Row, 'ORD_CANCEL_QTY', 0);

                    //-------------------------------------
                    //// 판매단가 setting
                    //-------------------------------------
                    nPrc = 0;

                    vCurr = this.ds_Detail.getColumn(0, "TUNCU");
                    vCurr = "2" + vCurr;

                    vPidate = this.ds_Head.getColumn(0, "ARG_SDATE");
                    vCvcod = this.ds_Head.getColumn(0, "ARG_CVCOD");

                    //// 판매단가
                    nPrc = this.gf_sale_danga(vPidate, vCvcod, vs_Data, vCurr);

                    nOderqty = 0;
                    nOderqty = this.ds_Detail_1.getColumn(vn_Row, "ORDER_QTY");

                    this.ds_Detail_1.setColumn(vn_Row, 'PIAMT', nexacro.round(nOderqty * nPrc, 2));

                    var vs_event = new nexacro.ChangeEventInfo();

                    vs_event.newvalue = nOderqty;

                    vs_event.columnid = "ORDER_QTY";

                    vs_event.row = vn_Row;

                    this.ff_Object_onitemchanged(this.ds_Detail_1, vs_event);

                    var vs_Itnbr = this.ds_Detail_1.getColumn(vn_Row, "ITNBR");

                    var vs_Sql = " SELECT 	NVL(FUN_GET_SORDER_TOTAL_QTY('" + vPidate + "','" + vCvcod + "','" + vs_Itnbr + "'),0) AS DEPT_ORDER_QTY, ";
                    vs_Sql += " 		NVL(FUN_GET_REQ_TOTAL_QTY('" + vPidate + "','" + vCvcod + "','" + vs_Itnbr + "'),0) AS DEPT_REQ_QTY ";
                    vs_Sql += " FROM DUAL ";

                    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT_TOTAL_QTY", "ff_Callback_sync");
                    if (vi_ErrorCode < 0) return;

                    this.ds_Detail_1.setColumn(vn_Row, "DEPT_ORDER_QTY", this.ds_Temp.getColumn(0, "DEPT_ORDER_QTY"));
                    this.ds_Detail_1.setColumn(vn_Row, "DEPT_REQ_QTY", this.ds_Temp.getColumn(0, "DEPT_REQ_QTY"));

                    // KIT 상품인지 확인. POPUP
                    var vs_cnt = this.gf_SelectSql_sync("ds_Temp: Select count(*) from itemas_mrp where itnbr = '" + vs_Data + "' and containgu = 'Y'  ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

                    if (vs_cnt[1] > 0) {
                        this.ff_co_popu_itemaskit_f("co_popu_itnkit", vs_Data);
                        break; //** 문석
                    }

                    //** 문석
                    var vs_cnt2 = this.gf_SelectSql_sync("ds_Temp: Select count(*) from itemas_set where itnbr = '" + vs_Data + "' ", null, null, 0);

                    if (vs_cnt2[1] > 0) {
                        this.ff_co_popu_itemaskit_f("co_popu_itnset", vs_Data);
                    }

                    break;

                case 'JISI_QTY':

                    this.ds_Detail_1.setColumn(vn_Row, 'ORDER_QTY', vs_Data);
                    this.ds_Detail_1.setColumn(vn_Row, 'PROD_QTY', vs_Data);
                    this.ds_Detail_1.setColumn(vn_Row, 'PISTS', '.');

                    var vs_event = new nexacro.ChangeEventInfo();

                    vs_event.newvalue = vs_Data;

                    vs_event.columnid = "ORDER_QTY";

                    vs_event.row = vn_Row;

                    this.ff_Object_onitemchanged(this.ds_Detail_1, vs_event);

                    var nOrdqty = parseInt(vs_Data);
                    var nPrc = this.ds_Detail_1.getColumn(vn_Row, "PIPRC");
                    var nAmt = nOrdqty * nPrc;
                    this.ds_Detail_1.setColumn(vn_Row, 'PIAMT', nAmt);

                    break;

                case 'ORD_CANCEL_QTY':

                    var nQty = this.ds_Detail_1.getColumn(vn_Row, "JISI_QTY");
                    var nBoqty = parseInt(vs_Data);
                    var nRoqty = nQty - nBoqty;
                    var nPiprc = this.ds_Detail_1.getColumn(vn_Row, "PIPRC");

                    if (nRoqty < 0) {
                        alert(" Back Order 수량이 당초의 요청수량을 초과합니다.");
                        this.ds_Detail_1.setColumn(vn_Row, 'ORD_CANCEL_QTY', 0);

                        return;
                    }

                    this.ds_Detail_1.setColumn(vn_Row, 'ORDER_QTY', nRoqty);
                    this.ds_Detail_1.setColumn(vn_Row, 'PIAMT', nRoqty * nPiprc);

                    break;

                case 'ORDER_QTY':
                    //---------------------------------------
                    //// 수량
                    //---------------------------------------
                    nOldqty = this.ds_Detail_1.getColumn(vn_Row, "OLDQTY");
                    nOderqty = 0;

                    nOderqty = this.ds_Detail_1.getColumn(vn_Row, "ORDER_QTY");

                    vSuju_sts = this.ds_Detail_1.getColumn(vn_Row, "SUJU_STS");

                    if (vSuju_sts == "7") {
                        if (nOderqty > nOldqty) {
                            alert("승인된 품목은 수량을 상향조정하실 수 없습니다.");
                            this.ds_Detail_1.setColumn(vn_Row, 'ORDER_QTY', nOldqty);
                            return;
                        }
                    }

                    if (nHoldQty > nOderqty) {
                        alert("기할당수량 및 작업지시수량보다 커야합니다.\n[ 할당수량:" + new String(nHoldqty) + "]");
                        this.ds_Detail_1.setColumn(vn_Row, 'ORDER_QTY', nOldqty);

                        return;
                    }

                    this.ds_Detail_1.setColumn(vn_Row, 'PIAMT', 0);

                    vPidate = this.ds_Head.getColumn(0, "ARG_SDATE");
                    vItnbr = this.ds_Detail_1.getColumn(vn_Row, "ITNBR");
                    vPspec = this.ds_Detail_1.getColumn(vn_Row, "ORDER_PSPEC");

                    if (NXCore.isEmpty(vPidate) || vPidate == '') {
                        alert("발행일자를 먼저 입력하세요.");
                        this.ds_Detail_1.setColumn(vn_Row, 'ORDER_QTY', nOldqty);

                        return;
                    }

                    if (NXCore.isEmpty(vItnbr) || vItnbr == '') {
                        alert("품번을 먼저 입력하세요.");
                        this.ds_Detail_1.setColumn(vn_Row, 'ORDER_QTY', nOldqty);
                        return;
                    }

                    if (NXCore.isEmpty(vPspec) || vPspec == '') {
                        alert("사양을 먼저 입력하세요.");
                        this.ds_Detail_1.setColumn(vn_Row, 'ORDER_QTY', nOldqty);
                        return;
                    }

                    //-----------------------------------------------------
                    //// 단가(check 기능)
                    //-----------------------------------------------------
                    if (this.ff_Danga(this.ds_Detail_1, vn_Row, vItnbr, vPspec, nOderqty) == -1) {
                        this.ff_ClearItem(this.ds_Detail_1, vn_Row);


                        return;
                    }

                    nPrice = this.ds_Detail_1.getColumn(vn_Row, "PIPRC");

                    if (NXCore.isEmpty(nPrice) || nPrice == '') {
                        nPrice = 0;
                    }

                    //-----------------------------------------------------
                    //// 원화 주문단가, 원화 주문금액 setting
                    //-----------------------------------------------------
                    if (this.ff_Calamt(this.ds_Detail_1, vn_Row, nPrice, nOderqty) == -1) {
                        this.ds_Detail_1.setColumn(vn_Row, 'ORDER_QTY', nOldqty);
                        return;
                    }
                    break;

                case 'PIPRC':
                    if (ivChk == "1") {
                        alert("C/I 연결된 수주는 변경하실 수 없습니다.!!");
                        return;
                    }

                    nPrice = this.ds_Detail_1.getColumn(vn_Row, "PIPRC");
                    nOrder_qty = this.ds_Detail_1.getColumn(vn_Row, "ORDER_QTY");

                    //-----------------------------------------------------
                    //-----------------------------------------------------
                    if (this.ff_Calamt(this.ds_Detail_1, vn_Row, nPrice, nOrder_qty) == -1) {
                        this.ds_Detail_1.setColumn(vn_Row, 'PIPRC', 0);
                        return;
                    }

                    var nAmt = nOrder_qty * nPrice
                    this.ds_Detail_1.setColumn(vn_Row, 'PIAMT', nAmt);
                    break;

                case 'OUT_GU':
                    if (NXCore.isEmpty(vs_Data) || vs_Data == '') {
                        return;
                    }


                    vRet = this.gf_SelectSql_sync("ds_Temp: SELECT TYPGBN, "
                        + "        TRAGBN  "
                        + " FROM IOMATRIX  "
                        + " WHERE IOGBN = '" + vs_Data + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

                    if (vRet[1] != "3") {
                        alert("수주관련구분만 가능합니다.!!");
                        this.ds_Detail_1.setColumn(vn_Row, 'OUT_GU', '');
                        return;
                    }

                    vPidate = this.ds_Head.getColumn(0, "ARG_SDATE");
                    vCvcod = this.ds_Head.getColumn(0, "ARG_CVCOD");

                    vCurr = this.ds_Detail.getColumn(0, "TUNCU");
                    vCurr = "2" + vCurr;

                    for (i = vn_Row; i <= this.ds_Detail_1.rowcount - 1; i++) {
                        vItnbr = this.ds_Detail_1.getColumn(i, "ITNBR");

                        ///////////////////////////////////////////////////////////////
                        // 하나를 수정하면 이하를 수정하는 기능을 수행하지 못하게 한다.
                        // SetItem(vDw, i, "out_gu", vData);
                        ///////////////////////////////////////////////////////////////

                        if (vRet[2] == "8") //// 무상출고일 경우 단가
                        {
                            this.ds_Detail_1.setColumn(i, 'PIPRC', 0);
                            this.ds_Detail_1.setColumn(i, 'PIAMT', 0);
                            this.ds_Detail_1.setColumn(i, 'ORDER_PRC', 0);
                            this.ds_Detail_1.setColumn(i, 'ORDER_AMT', 0);
                            this.ds_Detail_1.setColumn(i, 'USDAMT', 0);
                            this.ds_Detail_1.setColumn(i, 'DC_RATE', 0);
                            this.ds_Detail_1.setColumn(i, 'AMTGU', 'N');

                        }
                        else {
                            //-------------------------------------
                            //// 판매단가 setting
                            //-------------------------------------
                            nPrc = this.gf_sale_danga(vPidate, vCvcod, vItnbr, vCurr);

                            this.ds_Detail_1.setColumn(i, 'PIPRC', nPrc);

                            nOderqty = 0;

                            nOderqty = this.ds_Detail_1.getColumn(i, "ORDER_QTY");

                            this.ds_Detail_1.setColumn(i, 'PIAMT', nexacro.round(nOderqty * nPrc, 2));

                            //// 유/무상 구분
                            this.ds_Detail_1.setColumn(i, 'AMTGU', 'Y');
                        }

                        ///////////////////////////////////////////////////////////////
                        // 하나를 수정하면 이하를 수정하는 기능을 수행하지 못하게 한다.
                        if (i >= vn_Row) {
                            i = this.ds_Detail_1.rowcount + 1;
                        }
                        ///////////////////////////////////////////////////////////////

                    }
                    break;

                case 'DEPOT_NO':
                    for (i = vn_Row; i < this.ds_Detail_1.rowcount; i++) {
                        this.ds_Detail_1.setColumn(i, "DEPOT_NO", vs_Data);
                    }
                    break;

            }
        }
    }
    else {
        //Object 별 처리 
        // 상위 Div 이름을 가져와서 각각처리 함.
        vs_Data = e.postvalue;

        if (obj.parent.name == 'div_Head') {
            switch (obj.name) {
                case 'edt_Cvcod':
                    if (NXCore.isEmpty(vs_Data)) {
                        this.div_Head.edt_Cvnas.set_value(null);
                        return;
                    }

                    vs_Sql = " SELECT CVNAS2 FROM VNDMST WHERE  CVCOD = '" + vs_Data + "' ";
                    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT_CVCOD", "ff_Callback_sync");

                    if (vi_ErrorCode < 0) return;

                    if (this.ds_Temp.rowcount == 0) {
                        this.div_Head.edt_Cvcod.set_value(null);
                        this.div_Head.edt_Cvnas.set_value(null);
                        this.Tab00.tabpage1.Div_Detail.edt_Napcvcod.set_value(null);
                        this.Tab00.tabpage1.Div_Detail.edt_Napcvnas.set_value(null);

                    }
                    else {
                        this.ds_Head.setColumn(0, "ARG_CVNAS", this.ds_Temp.getColumn(0, "CVNAS2"));
                        this.ds_Detail.setColumn(0, "CUST_NO", vs_Data);
                        this.ds_Detail.setColumn(0, "NAPCVNAS", this.ds_Temp.getColumn(0, "CVNAS2"));
                        if (input_Mode == 'I') {
                            vs_Sql = "SELECT PIMAKER, ORIGIN, PISANGHO, PACKING, PIATTN, PIFROM, TUNCU, PAYMENT,	TERMS"
                                + " 		   SHIPMENT, BANKNM, ACCNO, ACCNM, SWIFTCODE, BANKADDR"
                                + "	  FROM EXPPIH									"
                                + "  WHERE CVCOD = '" + vs_Data + "'		"
                                + "		 AND ORDER_NO = (SELECT MAX(ORDER_NO) FROM EXPPIH WHERE CVCOD = '" + vs_Data + "')";
                            this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "EXPPIH_SELECT", "ff_Callback_sync");
                            this.ds_Detail.set_enableevent(false);
                            if (this.ds_Temp.rowcount > 0) {
                                this.ds_Detail.setColumn(0, "PIATTN", this.ds_Temp.getColumn(0, "PIATTN"));
                                this.ds_Detail.setColumn(0, "PIFROM", this.ds_Temp.getColumn(0, "PIFROM"));
                                this.ds_Detail.setColumn(0, "TERMS", this.ds_Temp.getColumn(0, "TERMS"));
                                this.ds_Detail.setColumn(0, "PAYMENT", this.ds_Temp.getColumn(0, "PAYMENT"));
                                this.ds_Detail.setColumn(0, "SHIPMENT", this.ds_Temp.getColumn(0, "SHIPMENT"));
                                this.ds_Detail.setColumn(0, "TUNCU", this.ds_Temp.getColumn(0, "TUNCU"));
                                this.ds_Detail.setColumn(0, "BANKNM", this.ds_Temp.getColumn(0, "BANKNM"));
                                this.ds_Detail.setColumn(0, "ACCNO", this.ds_Temp.getColumn(0, "ACCNO"));
                                this.ds_Detail.setColumn(0, "ORIGIN", this.ds_Temp.getColumn(0, "ORIGIN"));
                                this.ds_Detail.setColumn(0, "PIMAKER", this.ds_Temp.getColumn(0, "PIMAKER"));
                                this.ds_Detail.setColumn(0, "PISANGHO", this.ds_Temp.getColumn(0, "PISANGHO"));
                                this.ds_Detail.setColumn(0, "ACCNM", this.ds_Temp.getColumn(0, "ACCNM"));
                                this.ds_Detail.setColumn(0, "SWIFTCODE", this.ds_Temp.getColumn(0, "SWIFTCODE"));
                                this.ds_Detail.setColumn(0, "PACKING", this.ds_Temp.getColumn(0, "PACKING"));
                                this.ds_Detail.setColumn(0, "BANKADDR", this.ds_Temp.getColumn(0, "BANKADDR"));
                                this.ff_Curr();

                            }
                            this.ds_Detail.set_enableevent(true);
                        }
                    }
                    break;

                case 'edt_Orderno':
                    vs_Sql = " SELECT COUNT(*) AS CNT FROM EXPPIH WHERE  ORDER_NO = '" + vs_Data + "' ";
                    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT_ORDERNO", "ff_Callback");

                    if (vi_ErrorCode < 0) return;
                    if (this.ds_Temp.getColumn(0, "CNT") > 0) {

                        this.ff_Tran("SELECT");
                    }
                    break;
                case "cal_Sdate":
                    // 20231212 팀별생산요청 수량 추가
                    if (NXCore.isEmpty(vs_Data) || vs_Data == '') {
                        this.ds_Head.setColumn(0, "ARG_SDATE", this.gf_today());
                    } else {
                        this.ff_total_qty();
                    }

                    break;
                case "cbo_Saupj":
                    this.gf_combo_grd_sync(this.Tab00.tabpage2.grd_Detail_1, "DEPOT_NO", "co_dddw_depot_1_saupj", vs_Data, 0);

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
        }
        else if (obj.parent.name == 'Div_Detail') {
            vn_Row = this.ds_Detail.rowposition;
            switch (obj.name) {
                case 'edt_Areacd':
                    if (NXCore.isEmpty(vs_Data) || vs_Data == '') {
                        this.ds_Detail.setColumn(vn_Row, "AREANM", "");
                        return;
                    }

                    vs_Sql = "SELECT AREANM FROM AREA "
                    vs_Sql += "  WHERE AREACD = '" + vs_Data + "'";

                    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "ITNCT_SELECT", "ff_Callback_sync");

                    if (this.ds_Temp.rowcount == 0) {
                        //this.Div_Detail.ds_Detail.setFocus();  // cursor set
                        this.ds_Detail.setColumn(vn_Row, "AREACD", "");
                        this.ds_Detail.setColumn(vn_Row, "AREANM", "");
                    }
                    else {
                        this.ds_Detail.setColumn(vn_Row, "AREANM", this.ds_Temp.getColumn(0, "AREANM"));
                    }
                    break;

                case 'edt_emp_id':
                    if (obj.name == "edt_emp_id") {
                        var vCol_no = "EMP_ID";
                        var vCol_name = "SALES_EMPNAME";
                    }

                    if (NXCore.isEmpty(vs_Data) || vs_Data == '') {
                        this.ds_Detail.setColumn(0, "PISANGHO", "");
                        //	this.ds_Detail.setColumn(0, "PIADDR", "");

                        this.ds_Detail.setColumn(0, vCol_no, "");
                        this.ds_Detail.setColumn(0, vCol_name, "");

                        return;
                    }

                    var vOpenSale = new Array();
                    vOpenSale[0] = 'SAWON';
                    vOpenSale[1] = vs_Data;

                    var vReturnSale = this.gfi_get_name_sale(vOpenSale);

                    if (vReturnSale[1] == "NOT EXISTS" || vReturnSale[5] != "1") {
                        alert("사원번호가 존재하지 않거나 현 재직자가 아닙니다.");

                        this.ds_Detail.setColumn(0, vCol_no, "");
                        this.ds_Detail.setColumn(0, vCol_name, "");
                        return;
                    }
                    else {

                        this.ds_Detail.setColumn(0, vCol_no, vReturnSale[1]);
                        this.ds_Detail.setColumn(0, vCol_name, vReturnSale[2]);
                        return;
                    }


                    var vRet = this.gf_SelectSql_sync("ds_Temp: SELECT PISANGHO,  "
                        + "        PIADDR     "
                        + " FROM EXPPIH       "
                        + " WHERE ORDER_NO = (SELECT max(ORDER_NO) "
                        + "                   FROM EXPPIH          "
                        + "                   WHERE EMP_ID = '" + TrimAll(vs_Data) + "' "
                        + "                  ) ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

                    if (vRet[0] == 0) {
                        this.ds_Detail.setColumn(0, "PISANGHO", "");
                        //	this.ds_Detail.setColumn(0, "PIADDR", "");
                        return;
                    }

                    this.ds_Detail.setColumn(0, "PISANGHO", vRet[1]);
                    //	this.ds_Detail.setColumn(0, "PIADDR", vRet[2]);
                    break;


                case 'cbo_Cunit':
                    this.ff_Curr();
                    break;
            }
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
            var vs_itnbr;
            // ds_Head를 이용해서 sub ds 조회 
            vs_itnbr = this.ds_Detail.getColumn(e.row, 'ITNBR');
            this.ds_Head.setColumn(0, 'ARG_ITNBR', vs_itnbr);

            this.ff_Tran("SELECT_ITMBUY");
        }
        else if (obj.id == 'grd_List') {
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
    // obj가 Grid를 확인해서 처리함	
    if (obj == '[object Grid]') {
        if (obj.id == 'grd_List') {
            return;
        }
        else if (obj.id == 'grd_List') {
            return;
        }
        else if ('grd_Detail_1') {
            switch (this.gf_GetCellBind(obj, e.cell, 'Body')) {
                case 'ITNBR':
                    var vOpenParam = new Array();
                    vOpenParam[0] = '1,7';      // 품목구분 
                    vOpenParam[1] = null;       // 사업장
                    vOpenParam[2] = this.gf_today(); // 일자
                    vOpenParam[3] = null;       // 거래처
                    vOpenParam[4] = null;       // 통화
                    vOpenParam[5] = '3';        // 통화기준
                    vOpenParam[6] = vs_Data;       // 형번(품번)
                    vOpenParam[7] = null;       // 품명
                    vOpenParam[8] = 'M';    // 선택기준 M:Multi, S:Single
                    this.ff_itemas_f_pop("co_pop_itemas_4_detail_rbtn", vOpenParam);      // popup 을 띠움.

                    break;
            }
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
                case 'edt_Orderno':
                    var resultForm = this.gf_showPopup("popup_orderno", "co_popu::co_popu_exppih_f.xfdl", { width: 10, height: 20 },
                        {
                            OpenRetv: 'Y',   // popup open 즉시 조회  
                            MultSelect: 'N',   // MULTI LINE 선택
                            Argument: vs_Arg  // 조회조건 파라메터 
                        }, { callback: "ff_AfterPopup" });
                    break;
            }
        }
        else if (obj.parent.name == 'Div_Detail') {
            var vs_row; 					//데이터셋의 row 위치값
            switch (obj.name) {
                case 'edt_Areacd':
                    vs_row = this.ds_Detail.rowposition;
                    var resultForm = this.gf_showPopup("popup_object_area", "co_popu::co_popu_area_f.xfdl", { width: 10, height: 20 },
                        {
                            OpenRetv: 'Y',   // popup open 즉시 조회  
                            MultSelect: 'N',   // MULTI LINE 선택
                            Argument: vs_Arg  // 조회조건 파라메터 
                        }, { callback: "ff_AfterPopup" });

                    break;

                case 'edt_emp_id':

                    this.ff_co_popu_sawon_sale_f("popup_edt_emp_id_detail", '' + '|' + '' + '|' + vs_Data);

                    break;

                case 'edt_semno':
                    var resultForm = this.gf_showPopup("popup_object_semno", "si_send::si_send_giftsem_f.xfdl", { width: 10, height: 20 },
                        {
                            OpenRetv: 'Y',   // popup open 즉시 조회  
                            MultSelect: 'N',   // MULTI LINE 선택
                            Argument: '2'  // 조회조건 파라메터 
                        }, { callback: "ff_AfterPopup" });
                    break;

            }
        }
    }
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

/***********************************************************************
 * User created function specification
 ************************************************************************/
this.ff_Confrim = function (vs_Sdate) {
    var i;
    var vPino = this.ds_Head.getColumn(0, "ARG_ORDERNO");

    if (this.ds_Detail_1.rowcount > 0) {
        //품목정보 입력			
        for (i = 0; i < this.ds_Detail_1.rowcount; i++) {
            this.ds_Detail_1.setColumn(i, "SUJU_STS", '2');
            this.ds_Detail_1.setColumn(i, "ORD_OK_DATE", vs_Sdate);
        }
    }
    /*this.ds_Detail.setColumn(0,"PIAMT",this.Tab00.tabpage2.grd_Detail_1.getSummValue(9));
    this.ds_Detail.setColumn( 0, "PISTS", '2');
    this.ds_Detail.setColumn( 0, "ORDCFDT", vs_Sdate);		
    this.ds_Head.setColumn( 0, "PISTS", '2');
    this.ds_Head.setColumn( 0, "ORDCFDT", vs_Sdate);		*/

    var vCurr = this.ds_Detail.getColumn(0, "TUNCU");

    var vRet = this.gf_SelectSql_sync("ds_Temp: SELECT X.RSTAN,  "
        + "       X.USDRAT, "
        + "       Y.RFNA2   "
        + "  FROM RATEMT X, "
        + "       REFFPF Y  "
        + " WHERE X.RCURR = Y.RFGUB(+) "
        + "   AND Y.RFCOD = '10'       "
        + "   AND X.RDATE = '" + vs_Sdate + "' "
        + "   AND X.RCURR = '" + vCurr + "'", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

    var nWrate = vRet[1];
    var nUrate = vRet[2];
    var vWeight = vRet[3];

    this.ds_Detail.setColumn(0, "WRATE", nWrate);
    this.ds_Detail.setColumn(0, "URATE", nUrate);
    this.ds_Detail.setColumn(0, "WEIGHT", vWeight);

    var nRowcnt2 = this.ds_Detail_1.rowcount;

    for (i = 0; i <= nRowcnt2 - 1; i++) {
        var vOut_gu = this.ds_Detail_1.getColumn(i, "OUT_GU");

        var nPrc = this.ds_Detail_1.getColumn(i, "PIPRC");
        var nOrdqty = this.ds_Detail_1.getColumn(i, "ORDER_QTY");
        var nBoqty = this.ds_Detail_1.getColumn(i, "ORD_CANCEL_QTY");

        if ((NXCore.isEmpty(nOrdqty) || nOrdqty == '' || nOrdqty == 0) && (NXCore.isEmpty(nBoqty) || nBoqty == '' || nBoqty == 0)) {
            alert("주문수량을 입력하세요!!");
            this.gf_cursor_setting(this.Tab00.tabpage2.grd_Detail_1, i, "ORDER_QTY");
            return;
        }

        //// 유상 출고일 경우만 단가 확인(2009.04.21)
        if (vOut_gu == "O02" || vOut_gu == "OZ7") {
            if (NXCore.isEmpty(nPrc) || nPrc == '' || nPrc == 0) {
                alert("주문단가를 입력하세요!");
                this.gf_cursor_setting(this.Tab00.tabpage2.grd_Detail_1, i, "PIPRC");
                return;
            }
        }

        if (this.ds_Detail_1.getRowType(i) == '2') {
            this.ds_Detail_1.setColumn(i, "SUJU_STS", '2');
            this.ds_Detail_1.setColumn(i, "ORD_OK_DATE", vs_Sdate);	//// 확정일자
        }
    }

    //--------------------------------------------------------
    //// detail, charge 수출금액, 원화금액, 외화금액 계산
    //--------------------------------------------------------
    if (this.ff_SetPiamt() < 0) {
        return;
    }

    this.ds_Head.setColumn(0, "PISTS", '2');
    this.ds_Head.setColumn(0, "ORDCFDT", vs_Sdate);
    this.ds_Detail.setColumn(0, "PISTS", '2');
    this.ds_Detail.setColumn(0, "ORDCFDT", vs_Sdate);

    var vSql = "UPDATE SORDER SET SUJU_STS = '2', ORD_OK_DATE = '" + vs_Sdate + "' WHERE ORDER_NO LIKE '" + vPino + "'||'%' ";

    this.gf_UpdateSql_sync(vSql, 'UPDATE_SQL', "ff_Callback_sync", 0);

    //-----------------------------------------------------
    //// 일반정보 저장(START)
    //-----------------------------------------------------
    var nPiamt = this.ds_Detail.getColumn(0, "PIAMT");

    vSql = " UPDATE EXPPIH                       "
        + "    SET PISTS   = '2',               "
        + "        ORDCFDT = '" + vs_Sdate + "', "
        + "        PIAMT   =  " + nPiamt + ",  "
        + "        WRATE   =  " + nWrate + ",  "
        + "        URATE   =  " + nUrate + "   "
        + " WHERE ORDER_NO = '" + vPino + "'    ";


    this.gf_UpdateSql_sync(vSql, 'UPDATE_SQL', "ff_Callback_sync", 0);

    //-----------------------------------------------------
    //// 일반정보 저장(End)
    //-----------------------------------------------------

    if (this.ds_Head.getColumn(0, "PISTS") == "2") {
        //----------------------------------------------
        //// 출고기준이 할당("N"), 수주("Y") 인지 확인
        //----------------------------------------------

        vRet1 = this.gf_SelectSql_sync("ds_Temp: SELECT substr(DATANAME, 1, 1) "
            + " FROM SYSCNFG       "
            + " WHERE SYSGU  = 'S' "
            + "   AND SERIAL = 11  "
            + "   AND LINENO = '1' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

        if (vRet1[1] == "N") {
            //----------------------------------
            //// 자동할당 처리
            //----------------------------------
            if (this.ff_AutoHold(vPino) == -1) {
                return;
            }
        }
    }

    ////---------------------
    //// 자료 조회...
    ////---------------------
    this.btn_query_onclick();

    return;

    //this.ff_Tran("SAVE_MASTER");

}

this.ff_Calamt = function (vn_Row, vn_Prc, vn_Qty) {

    return 1;

}

this.ff_Depot = function (vs_Saupj, vn_Row) {
    var vs_Sql;

    vs_Sql = "SELECT CVCOD FROM VNDMST_STOCK ";
    vs_Sql += "  WHERE SAUPJ= '" + vs_Saupj + "' AND JUHANDLE = '2' ";

    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "DEPOT_SELECT", "ff_Callback_sync");

    this.ds_Detail_1.setColumn(vn_Row, "DEPOT_NO", this.ds_Temp.getColumn(0, "CVCOD"));
}

this.ff_Curr = function () {
    var vs_Sql;
    var vs_Cunit = this.ds_Detail.getColumn(0, "TUNCU");
    var vs_Sdate = this.ds_Head.getColumn(0, "ARG_SDATE");
    vs_Sql = "SELECT RSTAN, USDRAT FROM RATEMT ";
    vs_Sql += "  WHERE RCURR= '" + vs_Cunit + "' AND RDATE = '" + vs_Sdate + "'";

    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "RATE_SELECT", "ff_Callback_sync");

    if (this.ds_Temp.rowcount == 0) {
        this.gf_message_chk("102336", ""); // 일일환율을 먼저 등록하십시오.
        this.ds_Detail.setColumn(0, "WRATE", 0);
        this.ds_Detail.setColumn(0, "URATE", 0);
        this.ds_Detail.setColumn(0, "TUNCU", "");
        return;
    }
    else {
        this.ds_Detail.setColumn(0, "WRATE", this.ds_Temp.getColumn(0, "RSTAN"));
        this.ds_Detail.setColumn(0, "URATE", this.ds_Temp.getColumn(0, "USDRAT"));

    }
}

// 조건 체크 (필수 입력 항목 체크)
this.ff_required_chk = function (vs_mode) {
    var vs_Gbn;
    var vs_Data, vs_Itcls;
    var i, vi_Row, vi_len;

    // 공통 체크처리 


    // 등록(I), 수정(M), 조회(R) 에서 필수 값 체크   
    // 가능하면 HEAD, MASTER까지 모두 여기서 체크, 처리 해주세요.

    switch (vs_mode) {
        //조회
        case "R":
            if (input_Mode == 'I') {
                if (NXCore.isEmpty(this.div_Head.edt_Cvcod.value)) {
                    this.gf_message_chk("200", "");  //alert("필수입력 항목입니다.");
                    this.div_Head.edt_Cvcod.setFocus();
                    return false;
                }
            }
            else {
                if (NXCore.isEmpty(this.div_Head.edt_Orderno.value)) {
                    this.gf_message_chk("200", "");  //alert("필수입력 항목입니다.");
                    this.div_Head.edt_Orderno.setFocus();
                    return false;
                }
            }
            break;
        //입력 
        case "I":
        //수정모드  
        case "M":
            vs_Data = this.ds_Head.getColumn(0, "ARG_CVCOD");
            if (NXCore.isEmpty(vs_Data)) {
                this.gf_message_chk("200", this.gf_get_trans_word("거래처"));
                this.div_Head.edt_Cvcod.setFocus();
                return false;
            }

            vs_Data = this.ds_Detail.getColumn(0, "EMP_ID");
            if (NXCore.isEmpty(vs_Data)) {
                this.gf_message_chk("200", this.gf_get_trans_word("영업담당자"));
                this.Tab00.tabpage1.Div_Detail.cbo_Empid.setFocus();  // cursor set
                return false;
            }
            vs_Data = this.ds_Detail.getColumn(0, "TUNCU");
            if (NXCore.isEmpty(vs_Data)) {
                this.gf_message_chk("200", this.gf_get_trans_word("통화단위"));
                this.Tab00.tabpage1.Div_Detail.cbo_Cunit.setFocus();  // cursor set
                return false;
            }
            vs_Data = this.ds_Detail.getColumn(0, "SHIPREQ");
            if (NXCore.isEmpty(vs_Data)) {
                this.gf_message_chk("200", this.gf_get_trans_word("선적요구일"));
                this.Tab00.tabpage1.Div_Detail.cal_Shipreq.setFocus();  // cursor set
                return false;
            }
            vs_Data = this.ds_Detail.getColumn(0, "INSPECTION");
            if (NXCore.isEmpty(vs_Data) || vs_Data == '100') {
                this.gf_message_chk("200", this.gf_get_trans_word("결제조건"));
                this.Tab00.tabpage1.Div_Detail.cbo_paygbn.setFocus();  // cursor set
                return false;
            }

            for (i = 0; i < this.ds_Detail_1.rowcount; i++) {
                // 추가나 수정된 로우를 찾는다.
                vi_Row = this.ds_Detail_1.findRowExpr("(this.getRowType(rowidx)==4)||(this.getRowType(rowidx)==2)", i);
                if (vi_Row < 0) break;
                i = vi_Row;

                vs_Data = this.ds_Detail_1.getColumn(vi_Row, "ITNBR");
                if (NXCore.isEmpty(vs_Data)) {
                    this.gf_message_chk("200", this.gf_get_trans_word("품번"));
                    this.gf_cursor_setting(this.Tab00.tabpage2.grd_Detail_1, vi_Row, "ITNBR")
                    return false;
                }
                vs_Data = this.ds_Detail_1.getColumn(vi_Row, "OUT_GU");
                if (NXCore.isEmpty(vs_Data)) {
                    this.gf_message_chk("200", this.gf_get_trans_word("수불구분"));
                    this.gf_cursor_setting(this.Tab00.tabpage2.grd_Detail_1, vi_Row, "OUT_GU")
                    return false;
                }
                vs_Data = this.ds_Detail_1.getColumn(vi_Row, "PIPRC");
                if (NXCore.isEmpty(vs_Data)) {
                    this.gf_message_chk("200", this.gf_get_trans_word("단가"));
                    this.gf_cursor_setting(this.Tab00.tabpage2.grd_Detail_1, vi_Row, "PIPRC")
                    return false;
                }
                vs_Data = this.ds_Detail_1.getColumn(vi_Row, "ORDER_QTY");
                if (NXCore.isEmpty(vs_Data)) {
                    this.gf_message_chk("200", this.gf_get_trans_word("수량"));
                    this.gf_cursor_setting(this.Tab00.tabpage2.grd_Detail_1, vi_Row, "ORDER_QTY")
                    return false;
                }

                vs_Data = this.ds_Detail_1.getColumn(vi_Row, "DEPOT_NO");
                if (NXCore.isEmpty(vs_Data)) {
                    this.gf_message_chk("200", this.gf_get_trans_word("출고창고"));
                    this.gf_cursor_setting(this.Tab00.tabpage2.grd_Detail_1, vi_Row, "DEPOT_NO")
                    return false;
                }

                /* 홍성표 수정 미허가 품목 막음*/
                var vs_Cvcod = this.ds_Head.getColumn(0, "ARG_CVCOD");
                var vItnbr = this.ds_Detail_1.getColumn(vi_Row, "ITNBR");
                var vGubun = '';
                var vIogbn = this.ds_Detail_1.getColumn(vi_Row, "OUT_GU");

                //GUBUN_1 : 중국(14831), GUBUN_2 : 미국(14770), GUBUN_3 : 태국(14836), GUBUN_4 : 대만(14846)
                vs_Sql = " SELECT GUBUN_1, GUBUN_2, GUBUN_3, GUBUN_4 FROM ITEMAS_LCS_GUB ";
                vs_Sql += "  WHERE ITNBR = '" + vItnbr + "' ";

                this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT_EXPPIH", "ff_Callback_sync");
                if (vi_ErrorCode < 0) return;

                //품목명에 'US' 가 들어가거나 사급출고의 경우 통제 제외
                if (vItnbr.substr(1, 2) != "US" && vIogbn == 'O02') {
                    //중국법인
                    if (vs_Cvcod == '14831') {
                        vGubun = this.ds_Temp.getColumn(0, "GUBUN_1");

                        if (NXCore.isEmpty(vGubun) || vGubun < 1) {
                            alert("미허가 품목은 주문할 수 없습니다!.");
                            return;
                        }
                    }//미국법인
                    else if (vs_Cvcod == '14770') {
                        vGubun = this.ds_Temp.getColumn(0, "GUBUN_2");

                        if (NXCore.isEmpty(vGubun) || vGubun < 1) {
                            alert("미허가 품목은 주문할 수 없습니다!.");
                            return;
                        }
                    }//태국법인
                    else if (vs_Cvcod == '14836') {
                        vGubun = this.ds_Temp.getColumn(0, "GUBUN_3");

                        if (NXCore.isEmpty(vGubun) || vGubun < 1) {
                            alert("미허가 품목은 주문할 수 없습니다!.");
                            return;
                        }
                    }//대만법인
                    else if (vs_Cvcod == '14846') {
                        vGubun = this.ds_Temp.getColumn(0, "GUBUN_4");

                        if (NXCore.isEmpty(vGubun) || vGubun < 1) {
                            alert("미허가 품목은 주문할 수 없습니다!.");
                            return;
                        }
                    }
                }


            }
            for (i = 0; i < this.ds_Detail_2.rowcount; i++) {
                // 추가나 수정된 로우를 찾는다.
                vi_Row = this.ds_Detail_2.findRowExpr("(this.getRowType(rowidx)==4)||(this.getRowType(rowidx)==2)", i);
                if (vi_Row < 0) break;
                i = vi_Row;

                vs_Data = this.ds_Detail_2.getColumn(vi_Row, "CHRGU");
                if (NXCore.isEmpty(vs_Data)) {
                    this.gf_message_chk("200", this.gf_get_trans_word("CHARGE 구분"));
                    this.gf_cursor_setting(this.Tab00.tabpage3.grd_Detail_2, vi_Row, "CHARGU");
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
        case "SELECT":
            //alert(this.ds_Head.getColumn(0,"ARG_ORDERNO"));
            v_SvcAct = pvs_SvcAct;
            v_OutDataset = pvs_OutDataset;
            v_InDataset = pvs_InDataset;
            v_Argument = "";
            break;
        case "SAVE_MASTER":
            //trace(this.ds_Detail_1.saveXML());
            v_SvcAct = pvs_Save_SvcAct;
            v_InDataset = pvs_Save_InDataset;
            v_OutDataset = pvs_Save_OutDataset;
            break;
    }
    this.gf_Transaction_Async(strSvcId, v_SvcAct, v_InDataset, v_OutDataset, "ff_Callback");
}





// 콜백 함수 처리 
this.ff_Callback = function (sSvcID, ErrorCode, ErrorMsg) {
    var vs_Sql, vs_Orderno;

    if (ErrorCode < 0) {
        NXCore.alert('CallBack ERR = ' + ErrorMsg);
        return;
    }
    switch (sSvcID) {
        case "SELECT":
            //trace(this.ds_Head.saveXML());			
            if (this.ds_Detail.rowcount < 1) {
                this.gf_message_chk("110", ""); // 조회 및 출력할 자료가 없습니다.
                return;
            }
            this.ds_Head.set_enableevent(false);

            vs_Orderno = this.ds_Detail.getColumn(0, "ORDER_NO");
            vs_Sql = "SELECT CVCOD, FUN_GET_CVNAS(CVCOD) AS CVNAS, PIDATE, LOCALYN, PISTS, ORDCFDT,SAUPJ FROM EXPPIH ";
            vs_Sql += "  WHERE ORDER_NO = '" + vs_Orderno + "'";

            this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT_EXPPIH", "ff_Callback_sync");

            if (vi_ErrorCode < 0) return;

            this.ds_Head.setColumn(0, "ARG_CVCOD", this.ds_Temp.getColumn(0, "CVCOD"));
            this.ds_Head.setColumn(0, "ARG_CVNAS", this.ds_Temp.getColumn(0, "CVNAS"));
            this.ds_Head.setColumn(0, "ARG_SDATE", this.ds_Temp.getColumn(0, "PIDATE"));
            this.ds_Head.setColumn(0, "LOCALYN", this.ds_Temp.getColumn(0, "LOCALYN"));
            this.ds_Head.setColumn(0, "PISTS", this.ds_Temp.getColumn(0, "PISTS"));
            this.ds_Head.setColumn(0, "ORDCFDT", this.ds_Temp.getColumn(0, "ORDCFDT"));
            this.ds_Head.setColumn(0, "ARG_SAUPJ", this.ds_Temp.getColumn(0, "SAUPJ"));

            if (this.ds_Detail.getColumn(0, "INSPECTION") == '99') {
                this.Tab00.tabpage1.Div_Detail.cal_duedate.set_visible(true);
            } else {
                this.Tab00.tabpage1.Div_Detail.cal_duedate.set_visible(false);
            }

            if ((this.ds_Head.getColumn(0, "PISTS") == '1' || this.ds_Head.getColumn(0, "PISTS") == '3')) {
                //this.Tab00.tabpage1.Div_Detail.set_enable(true);
                this.Tab00.tabpage2.grd_Detail_1.set_enable(true);
                this.Tab00.tabpage3.grd_Detail_2.set_enable(true);
                this.div_Head.rad_Localyn.set_readonly(false);

                //tabpage1 enable 처리
                this.Tab00.tabpage1.Div_Detail.cbo_paygbn.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.txt_attn.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.edt_pifrom.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.edt_semno.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.edt_pono.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.edt_emp_id.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.edt_Areacd.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.cbo_Cunit.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.msk_old_piamt.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.cal_Shipreq.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.cal_Shipsch.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.cal_Invsch.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.cbo_Trans.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.edt_packing.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.cbo_invafternego.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.edt_payment.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.edt_terms.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.edt_Shipment.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.edt_banknm.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.edt_accno.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.edt_accno00.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.edt_swiftcode.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.txt_bankaddr.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.edt_Origin.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.edt_pimaker.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.edt_pisangho.set_enable(true);
                this.Tab00.tabpage1.Div_Detail.txt_Pinotes.set_enable(true);
            }
            else {
                //this.Tab00.tabpage1.Div_Detail.set_enable(false);
                //this.Tab00.tabpage2.grd_Detail_1.set_enable(false);
                this.Tab00.tabpage3.grd_Detail_2.set_enable(false);
                this.div_Head.rad_Localyn.set_readonly(true);
                this.Tab00.tabpage1.Div_Detail.cbo_paygbn.set_enable(true);//결제조건 수정 가능
                //tabpage1 enable 처리
                this.Tab00.tabpage1.Div_Detail.txt_attn.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.edt_pifrom.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.edt_semno.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.edt_pono.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.edt_emp_id.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.edt_Areacd.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.cbo_Cunit.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.msk_old_piamt.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.cal_Shipreq.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.cal_Shipsch.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.cal_Invsch.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.cbo_Trans.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.edt_packing.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.cbo_invafternego.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.edt_payment.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.edt_terms.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.edt_Shipment.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.edt_banknm.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.edt_accno.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.edt_accno00.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.edt_swiftcode.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.txt_bankaddr.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.edt_Origin.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.edt_pimaker.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.edt_pisangho.set_enable(false);
                this.Tab00.tabpage1.Div_Detail.txt_Pinotes.set_enable(false);

            }

            // 일반정보를 신규로 등록할 경우 변경모드로 전환하기 위해서...
            var vs_HOrderno = this.ds_Head.getColumn(0, "ARG_ORDERNO");
            if (NXCore.isEmpty(vs_HOrderno)) return;

            var vi_Tabindex = this.Tab00.tabindex;
            if (vi_Tabindex == 0 && input_Mode == 'I') {
                input_Mode = 'M';
                this.div_Input_Mode.btn_Modify_onclick();
                this.ds_Head.setColumn(0, "ARG_ORDERNO", vs_HOrderno);
                this.btn_query_onclick();
            }

            if (this.ds_Detail_1.rowcount > 0) {
                var i;

                for (i = 0; i <= this.ds_Detail_1.rowcount - 1; i++) {

                    var vSts = this.ds_Detail_1.getColumn(i, "PISTS");
                    var nQty = this.ds_Detail_1.getColumn(i, "JISI_QTY");
                    var nPdqty = this.ds_Detail_1.getColumn(i, "PROD_QTY");
                    var nShqty = this.Tab00.tabpage2.grd_Detail_1.getCellValue(i, 17);//13
                    var nBoqty = this.ds_Detail_1.getColumn(i, "ORD_CANCEL_QTY");
                    var nPiprc = this.ds_Detail_1.getColumn(i, "PIPRC");

                    if (vSts != '1' && vSts != '.' && vSts != 'R') {
                        if ((nQty != nPdqty) && (nBoqty == 0)) {

                            nBoqty = nShqty;
                            this.ds_Detail_1.setColumn(i, "ORD_CANCEL_QTY", nShqty);

                            var nRoqty = nQty - nBoqty;
                            this.ds_Detail_1.setColumn(i, "ORDER_QTY", nRoqty);

                            var nPiamt = nPiprc * nRoqty;
                            this.ds_Detail_1.setColumn(i, "PIAMT", nPiamt);
                        }
                    }
                }

                var vPists = this.ds_Head.getColumn(0, "PISTS");
                var vPino = this.ds_Head.getColumn(0, "ARG_ORDERNO");

                //--------------------------------------------
                //// 수주 확정 여부
                //--------------------------------------------

                var vRet2 = this.gf_SelectSql_sync("ds_Temp: SELECT nvl(count(*), 0)  "
                    + " FROM SORDER              "
                    + " WHERE ORDER_NO   LIKE '" + vPino + "'||'%' "
                    + "   AND OVERSEA_GU <> '1'  "
                    + "   AND SUJU_STS   <> '4'  ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

                if (vRet2[1] != 0 && (vPists == "1" || vPists == "3")) {
                    var nSpiamt = this.Tab00.tabpage2.grd_Detail_1.getSummValue(10);//9

                    this.ds_Detail.setColumn(0, "OLD_PIAMT", nSpiamt);
                    this.ds_Detail.setColumn(0, "PIAMT", nSpiamt);

                }
            }
            ////품목 구분 셋팅.
            if (NXCore.isEmpty(this.ds_Detail.getColumn(0, "FACTORY")) || this.ds_Detail.getColumn(0, "FACTORY") == '') {
                this.ds_Head.setColumn(0, "ARG_ITTYP", '1');//null일 경우(예전데이터들..)
            } else {
                this.ds_Head.setColumn(0, "ARG_ITTYP", this.ds_Detail.getColumn(0, "FACTORY"));
            }

            this.ds_Head.set_enableevent(true);

            break;
        case "SAVE_MASTER":
            this.gf_message_chk("140", ""); //자료생성(처리)이 정상적으로 처리되었습니다.
            this.ff_total_qty();
            //this.ff_Tran("SELECT");
            break;
    }
}

// popup  공통으로 arg_svc로 공통으로 띠움. 
this.ff_itemas_f_pop = function (arg_svc, arg_para) {
    var resultForm = this.gf_showPopup(arg_svc, "co_popu::co_popu_itemas_f_4_ex.xfdl", { width: 907, height: 500 },
        {
            OpenRetv: 'Y',   // popup open 즉시 조회  
            MultSelect: 'Y',   // MULTI LINE 선택 (이 아규먼트는 POPUP 프로그램에서 ARG_PARA 의 8번째 방으로 대체 한다. 
            Argument: arg_para
        }, { modal: true, layered: true, autosize: false, callback: "ff_AfterPopup" });
}

this.ff_co_popu_itemaskit_f = function (strId, arg_parm) {
    /** 문석수정
        var resultForm = this.gf_showPopup(strId,  "co_popu::co_popu_itemaskit_f.xfdl", {width:350, height:450},
            {	OpenRetv:   'Y',   // popup open 즉시 조회  
                MultSelect: '',   // MULTI LINE 선택 (이 아규먼트는 POPUP 프로그램에서 ARG_PARA 의 8번째 방으로 대체 한다. 
                Argument:  arg_parm 
            }, {modal:true, layered:true, autosize:false, callback:"ff_AfterPopup"});
    */
    if (strId == 'co_popu_itnkit') {
        var resultForm = this.gf_showPopup(strId, "co_popu::co_popu_itemaskit_f.xfdl", { width: 350, height: 450 },
            {
                OpenRetv: 'Y',   // popup open 즉시 조회  
                MultSelect: '',   // MULTI LINE 선택 (이 아규먼트는 POPUP 프로그램에서 ARG_PARA 의 8번째 방으로 대체 한다. 
                Argument: arg_parm
            }, { modal: true, layered: true, autosize: false, callback: "ff_AfterPopup" });
    } else if (strId == 'co_popu_itnset') {
        var resultForm = this.gf_showPopup(strId, "Moon::co_popu_itemasset_f.xfdl", { width: 350, height: 450 },
            {
                OpenRetv: 'Y',   // popup open 즉시 조회  
                MultSelect: '',   // MULTI LINE 선택 (이 아규먼트는 POPUP 프로그램에서 ARG_PARA 의 8번째 방으로 대체 한다. 
                Argument: arg_parm
            }, { modal: true, layered: true, autosize: false, callback: "ff_AfterPopup" });
    }
}


this.ff_Callback_sync = function (sSvcID, ErrorCode, ErrorMsg) {
    vi_ErrorCode = ErrorCode;     // 콜백루틴의 에러코드        싱크트란잭션일경우 사용
    vs_ErrorMsg = ErrorMsg;      //// 콜백루틴의 에러메세지    싱크트란잭션일경우 사용
    if (ErrorCode < 0) {
        NXCore.alert('CallBack SVCID = ' + sSvcID + '  ErrorCode = ' + ErrorCode + ' MSG = ' + ErrorMsg);
    }

    switch (sSvcID) {
        case "DELETE_PI":
            this.gf_message_chk("130", ""); //정상적으로 자료가 삭제되었습니다.
            this.ff_total_qty();
            this.div_Input_Mode.btn_Input_onclick();
            break;
    }
}

// pupup의 콜백함수 처리
this.ff_AfterPopup = function (strId, obj) {
    var va_data = this.gf_popup_data(obj);  // popup 에서 넘어온 data 를 array 로 받아온다.

    if (va_data == false) return;  // 자료 없음 

    switch (strId) {
        case "popup_confirm":
            this.ff_Confrim(va_data);
            break;
        case "popup_orderno":
            for (var i = 0; i < va_data.length; i++) {
                this.div_Head.edt_Orderno.set_value(va_data[i][0]);
                this.ff_Tran("SELECT");
            }
            break;
        case "popup_cvcod":
            for (var i = 0; i < va_data.length; i++) {
                this.div_Head.edt_Cvcod.set_value(va_data[i][0]);
                this.div_Head.edt_Cvnas.set_value(va_data[i][2]);

                if (input_Mode == 'I') {
                    vs_Sql = "SELECT PIMAKER, ORIGIN, PISANGHO, PACKING, PIATTN, PIFROM, TUNCU, PAYMENT,	TERMS"
                        + " 		   SHIPMENT, BANKNM, ACCNO, ACCNM, SWIFTCODE, BANKADDR"
                        + "	  FROM EXPPIH									"
                        + "  WHERE CVCOD = '" + va_data[i][0] + "'		"
                        + "		 AND ORDER_NO = (SELECT MAX(ORDER_NO) FROM EXPPIH WHERE CVCOD = '" + va_data[i][0] + "')";
                    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "EXPPIH_SELECT", "ff_Callback_sync");

                    this.ds_Detail.set_enableevent(false);
                    if (this.ds_Temp.rowcount > 0) {
                        this.ds_Detail.setColumn(0, "PIATTN", this.ds_Temp.getColumn(0, "PIATTN"));
                        this.ds_Detail.setColumn(0, "PIFROM", this.ds_Temp.getColumn(0, "PIFROM"));
                        this.ds_Detail.setColumn(0, "TERMS", this.ds_Temp.getColumn(0, "TERMS"));
                        this.ds_Detail.setColumn(0, "PAYMENT", this.ds_Temp.getColumn(0, "PAYMENT"));
                        this.ds_Detail.setColumn(0, "SHIPMENT", this.ds_Temp.getColumn(0, "SHIPMENT"));
                        this.ds_Detail.setColumn(0, "TUNCU", this.ds_Temp.getColumn(0, "TUNCU"));
                        this.ds_Detail.setColumn(0, "BANKNM", this.ds_Temp.getColumn(0, "BANKNM"));
                        this.ds_Detail.setColumn(0, "ACCNO", this.ds_Temp.getColumn(0, "ACCNO"));
                        this.ds_Detail.setColumn(0, "ORIGIN", this.ds_Temp.getColumn(0, "ORIGIN"));
                        this.ds_Detail.setColumn(0, "PIMAKER", this.ds_Temp.getColumn(0, "PIMAKER"));
                        this.ds_Detail.setColumn(0, "PISANGHO", this.ds_Temp.getColumn(0, "PISANGHO"));
                        this.ds_Detail.setColumn(0, "ACCNM", this.ds_Temp.getColumn(0, "ACCNM"));
                        this.ds_Detail.setColumn(0, "SWIFTCODE", this.ds_Temp.getColumn(0, "SWIFTCODE"));
                        this.ds_Detail.setColumn(0, "PACKING", this.ds_Temp.getColumn(0, "PACKING"));
                        this.ds_Detail.setColumn(0, "BANKADDR", this.ds_Temp.getColumn(0, "BANKADDR"));


                    }
                    this.ds_Detail.set_enableevent(true);
                }

            }
            this.ds_Detail.set_enableevent(true);
            var vs_ObjComp = this.getNextComponent(this.div_Head.edt_Cvcod);
            vs_ObjComp.setFocus();

            break;

        case "popup_pino":
            for (var i = 0; i < va_data.length; i++) {

                if (input_Mode == 'I') {
                    var vs_Sql = "SELECT A.PIATTN, A.PIFROM, A.TERMS, A.PAYMENT, A.COMMISSION, A.SHIPMENT, A.DELIVERY_TERMS, A.INSPECTION, 	"
                        + " 	     A.VALIDITY, A.ORIGIN, A.PIMAKER, A.PISANGHO, A.PIADDR, A.PINOTES, A.PACKING, A.CASEINFO,     "
                        + "       A.TITLE, A.CUST_NO, FUN_GET_CVNAS(A.CUST_NO) AS NAPCVNAS, A.VF_FROM, A.VF_TO, A.FACTORY,       "
                        + "       A.DEALER, FUN_GET_CVNAS(A.DEALER) AS DEALERNM, A.CVCOD, FUN_GET_CVNAS(A.CVCOD) AS CVNAS,     "
                        + "       A.EMP_ID, A.TUNCU, A.TRANS, A.AGENT, FUN_GET_CVNAS(A.AGENT) AS AGENTNM, A.AREACD, B.AREANM   "
                        + "	FROM EXPPIH A , AREA B									"
                        + " WHERE A.AREACD = B.AREACD(+) AND A.ORDER_NO = '" + va_data[i][0] + "' ";

                    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "EXPPIH_SELECT", "ff_Callback_sync");
                    if (vi_ErrorCode < 0) return;
                    this.ds_Detail.set_enableevent(false);
                    if (this.ds_Temp.rowcount > 0) {

                        this.ds_Detail.setColumn(0, "PIATTN", this.ds_Temp.getColumn(0, "PIATTN"));
                        this.ds_Detail.setColumn(0, "PIFROM", this.ds_Temp.getColumn(0, "PIFROM"));
                        this.ds_Detail.setColumn(0, "TERMS", this.ds_Temp.getColumn(0, "TERMS"));
                        this.ds_Detail.setColumn(0, "PAYMENT", this.ds_Temp.getColumn(0, "PAYMENT"));
                        // 						this.ds_Detail.setColumn(0, "COMMISSION", this.ds_Temp.getColumn(0,"COMMISSION"));
                        this.ds_Detail.setColumn(0, "SHIPMENT", this.ds_Temp.getColumn(0, "SHIPMENT"));
                        this.ds_Detail.setColumn(0, "DELIVERY_TERMS", this.ds_Temp.getColumn(0, "DELIVERY_TERMS"));
                        this.ds_Detail.setColumn(0, "INSPECTION", this.ds_Temp.getColumn(0, "INSPECTION"));
                        this.ds_Detail.setColumn(0, "VALIDITY", this.ds_Temp.getColumn(0, "VALIDITY"));
                        this.ds_Detail.setColumn(0, "ORIGIN", this.ds_Temp.getColumn(0, "ORIGIN"));
                        this.ds_Detail.setColumn(0, "PIMAKER", this.ds_Temp.getColumn(0, "PIMAKER"));
                        this.ds_Detail.setColumn(0, "PISANGHO", this.ds_Temp.getColumn(0, "PISANGHO"));
                        this.ds_Detail.setColumn(0, "PIADDR", this.ds_Temp.getColumn(0, "PIADDR"));
                        this.ds_Detail.setColumn(0, "PINOTES", this.ds_Temp.getColumn(0, "PINOTES"));
                        this.ds_Detail.setColumn(0, "PACKING", this.ds_Temp.getColumn(0, "PACKING"));
                        this.ds_Detail.setColumn(0, "CASEINFO", this.ds_Temp.getColumn(0, "CASEINFO"));
                        this.ds_Detail.setColumn(0, "TITLE", this.ds_Temp.getColumn(0, "TITLE"));
                        this.ds_Detail.setColumn(0, "CUST_NO", this.ds_Temp.getColumn(0, "CUST_NO"));
                        this.ds_Detail.setColumn(0, "NAPCVNAS", this.ds_Temp.getColumn(0, "NAPCVNAS"));
                        this.ds_Detail.setColumn(0, "VF_FROM", this.ds_Temp.getColumn(0, "VF_FROM"));
                        this.ds_Detail.setColumn(0, "VF_TO", this.ds_Temp.getColumn(0, "VF_TO"));
                        this.ds_Detail.setColumn(0, "FACTORY", this.ds_Temp.getColumn(0, "FACTORY"));
                        this.ds_Detail.setColumn(0, "DEALER", this.ds_Temp.getColumn(0, "DEALER"));
                        this.ds_Detail.setColumn(0, "DEALERNM", this.ds_Temp.getColumn(0, "DEALERNM"));
                        this.ds_Detail.setColumn(0, "EMP_ID", this.ds_Temp.getColumn(0, "EMP_ID"));
                        this.ds_Detail.setColumn(0, "TUNCU", this.ds_Temp.getColumn(0, "TUNCU"));
                        this.ds_Detail.setColumn(0, "TRANS", this.ds_Temp.getColumn(0, "TRANS"));
                        this.ds_Detail.setColumn(0, "AGENT", this.ds_Temp.getColumn(0, "AGENT"));
                        this.ds_Detail.setColumn(0, "CVNAS2", this.ds_Temp.getColumn(0, "AGENTNM"));
                        this.ds_Detail.setColumn(0, "AREACD", this.ds_Temp.getColumn(0, "AREACD"));
                        this.ds_Detail.setColumn(0, "AREANM", this.ds_Temp.getColumn(0, "AREANM"));


                        // 결제조건에 따른 일수지정
                        var vs_Sql1 = "";
                        vs_Sql1 += " SELECT A.RFNA2 AS ILSU, NVL(A.RFNA3,'Y') AS MOD       ";
                        vs_Sql1 += " FROM REFFPF A      ";
                        vs_Sql1 += " WHERE A.RFCOD = '52' AND A.RFGUB = '" + this.ds_Temp.getColumn(0, "PAYMENT") + "'   ";

                        this.gf_SelectSql_sync("ds_Temp : " + vs_Sql1, "SELECT_ILSU", "ff_Callback_sync");
                        if (vi_ErrorCode < 0) return;

                        if (this.ds_Temp.rowcount == 0) {
                            this.ds_Detail.setColumn(0, 'COMMISSION', null);
                            var vs_Mod = 'Y';
                        }
                        else {
                            this.ds_Detail.setColumn(0, 'COMMISSION', this.ds_Temp.getColumn(0, "ILSU"));
                            var vs_Mod = this.ds_Temp.getColumn(0, "MOD");
                        }

                        if (vs_Mod == 'Y') {
                            //this.Tab00.tabpage1.Div_Detail.msk_Commission.set_enable(true);
                        }
                        else {
                            //this.Tab00.tabpage1.Div_Detail.msk_Commission.set_enable(false);
                        }

                        this.ds_Head.setColumn(0, "ARG_CVCOD", this.ds_Temp.getColumn(0, "CVCOD"));
                        this.ds_Head.setColumn(0, "ARG_CVNAS", this.ds_Temp.getColumn(0, "CVNAS"));
                        this.ds_Head.setColumn(0, "ARG_ITTYP", this.ds_Temp.getColumn(0, "FACTORY")); //PI번호 불러올 경우 품목구분 셋팅
                    }
                }
            }
            this.ds_Detail.set_enableevent(true);
            var vs_ObjComp = this.getNextComponent(this.div_Head.edt_Cvcod);
            vs_ObjComp.setFocus();

            break;

        case "popup_object_area":
            for (var i = 0; i < va_data.length; i++) {
                this.ds_Detail.setColumn(0, "AREACD", va_data[i][0]);
                this.ds_Detail.setColumn(0, "AREANM", va_data[i][1]);
            }
            break;
        case "popup_object_cvcod":
            for (var i = 0; i < va_data.length; i++) {
                this.ds_Detail.setColumn(0, "AGENT", va_data[i][0]);
                this.ds_Detail.setColumn(0, "CVNAS2", va_data[i][2]);
            }
            break;

        case "popup_object_napcvcod":
            for (var i = 0; i < va_data.length; i++) {
                this.ds_Detail.setColumn(0, "CUST_NO", va_data[i][0]);
                this.ds_Detail.setColumn(0, "NAPCVNAS", va_data[i][2]);
            }
            break;

        case "popup_object_dealer":
            for (var i = 0; i < va_data.length; i++) {
                this.ds_Detail.setColumn(0, "DEALER", va_data[i][0]);
                this.ds_Detail.setColumn(0, "DEALERNM", va_data[i][2]);
            }
            break;


        case "popup_edt_emp_id_detail":
            for (var i = 0; i < va_data.length; i++) {
                this.ds_Detail.setColumn(0, "EMP_ID", va_data[i][0]);
                this.ds_Detail.setColumn(0, "SALES_EMPNAME", va_data[i][1]);


                vRet = this.gf_SelectSql_sync("ds_Temp: SELECT PISANGHO,  "
                    + "        PIADDR     "
                    + " FROM EXPPIH       "
                    + " WHERE ORDER_NO = (SELECT max(ORDER_NO) "
                    + "                   FROM EXPPIH          "
                    + "                   WHERE EMP_ID = '" + va_data[i][0] + "' "
                    + "                  )", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

                if (vRet[0] == 0) {
                    this.ds_Detail.setColumn(0, "PISANGHO", '');
                    //this.ds_Detail.setColumn(0,"PIADDR", '');
                    return;
                }

                this.ds_Detail.setColumn(0, "PISANGHO", vRet[1]);
                //this.ds_Detail.setColumn(0,"PIADDR", vRet[2]);
            }
            break;

        case "popup_object_semno":

            for (var i = 0; i < va_data.length; i++) {
                this.ds_Detail.setColumn(0, "SEMNO", va_data[i][7]);
            }
            break;

        case "popup_excel_upload":
            var nIns = 0;
            var vToday = this.gf_today();
            var vYymmdd = vToday.substr(0, 8);
            var vUser = application.gvs_userid;
            var vSaupj = this.ds_Head.getColumn(0, "ARG_SAUPJ");
            var vs_kitcnt;
            var vs_ittyp = this.ds_Head.getColumn(0, "ARG_ITTYP");
            var vs_ittypChk = '1';
            this.ds_Detail_1.set_enableevent(false);

            if (NXCore.isEmpty(this.ds_Detail.getColumn(0, "FACTORY")) || this.ds_Detail.getColumn(0, "FACTORY") == '') { ///과거 데이터는 체크 대상 X
                vs_ittypChk = '0';
            }

            for (var i = 0; i < va_data.length; i++) {
                /*if( i == this.ds_Detail_1.rowposition)
                {
                    vn_Row = this.ds_Detail_1.rowposition;
                            	
                }
                else
                {
                    vn_Row = this.ds_Detail_1.addRow();
                }*/

                var nOrder_qty = 0;
                var nHoldQty = 0;

                var vItnbr = va_data[i][0];      ///// 품번
                vItnbr = vItnbr.toUpperCase();
                vItnbr = vItnbr.replace(/'/g, '');
                var nOrder_prc = va_data[i][1];  ///// 단가
                var nOrder_qty = va_data[i][2];  ///// 수량
                var vBigo = va_data[i][3];

                if (nOrder_prc == 0) {
                    var vIogbn = "O18";
                }
                else {
                    var vIogbn = "O02";
                }

                nHoldQty = this.ff_SujuSts(this.ds_Detail_1, nIns);

                var vRet = this.gf_SelectSql_sync("ds_Temp: SELECT A.ITDSC,  "
                    + "        A.ISPEC,  "
                    + "        A.UNMSR,  "
                    + "        A.ITTYP,  "
                    + "        A.PRODNM,  "
                    + "        B.PROD_CLS  "
                    + " FROM ITEMAS A , ITEMAS_ADD_INFO B   "
                    + " WHERE A.ITNBR = '" + vItnbr + "' "
                    + "   AND A.ITNBR = B.ITNBR(+) "
                    + "   AND A.USEYN = '0' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);


                if (NXCore.isEmpty(vRet[1]) || vRet[1] == '' || vRet[1] == 0) {
                    if (application.confirm("[" + vItnbr + "]" + " 형번은 품목마스타에 존재하지 않습니다. \n계속진행하시겠습니다.") == false) {
                        return;
                    }
                    else {
                        var vMsg = i + 1 + "행의 " + vItnbr + " 형번이 품목마스타에 등록되어있지 않습니다.";

                        //-----------------------------------------
                        //// 자동 채번
                        //-----------------------------------------
                        var vJunpyoseq = this.gf_get_junpyo(vYymmdd, "Z3");
                        var vOrderNo = vYymmdd + vJunpyoseq;

                        var vSql_ins = " INSERT INTO EXCEL_HIST            "
                            + "             (JPONO,  SAUPJ,       "
                            + "              YYMMDD, TABLE_NM,    "
                            + "              PG_ID,  COL,        COL_NM, "
                            + "              DOC,    CREATE_BY )  "
                            + " VALUES ('" + vOrderNo + "', '" + vSaupj + "',         "
                            + "         '" + vYymmdd + "', 'SORDER',                 "
                            + "         'em_orde::em_orde_exppih_e.xfdl', '" + vItnbr + "', '품번', "
                            + "         '" + vMsg + "', '" + vUser + "')         ";

                        this.gf_UpdateSql_sync(vSql_ins, 'UPDATE_SQL', "ff_Callback_sync", 0);

                        continue;
                    }
                }

                if (vRet[6] == '1') {
                    alert(i + 1 + "행의 " + vItnbr + " 형번이 국내전용품목입니다.");
                    continue;
                }

                if (vs_ittypChk == '1') {
                    if (vRet[4] != vs_ittyp) {
                        var count_1 = i + 1;
                        alert("제품/상품 구분이 맞지 않습니다.\n" + count_1 + "행의 " + vItnbr + " 형번.");
                        continue;
                    }
                }


                //홍성표 수정 허가품목 검사

                var vs_Cvcod = this.ds_Head.getColumn(0, "ARG_CVCOD");
                var vGubun = '';

                //GUBUN_1 : 중국(14831), GUBUN_2 : 미국(14770), GUBUN_3 : 태국(14836), GUBUN_4 : 대만(14846)
                var vs_Sql = " SELECT GUBUN_1, GUBUN_2, GUBUN_3, GUBUN_4 FROM ITEMAS_LCS_GUB ";
                vs_Sql += "  WHERE ITNBR = '" + vItnbr + "' ";

                this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT_EXPPIH", "ff_Callback_sync");
                if (vi_ErrorCode < 0) return;

                //품목명에 'US' 가 들어가거나 사급출고의 경우 통제 제외
                if (vItnbr.substr(1, 2) != "US") {
                    //중국법인
                    if (vs_Cvcod == '14831') {
                        vGubun = this.ds_Temp.getColumn(0, "GUBUN_1");

                        if (NXCore.isEmpty(vGubun) || vGubun < 1) {
                            alert(i + 1 + "행의 " + vItnbr + " 형번이 미허가 품목입니다.");
                            continue;
                        }
                    }//미국법인
                    else if (vs_Cvcod == '14770') {
                        vGubun = this.ds_Temp.getColumn(0, "GUBUN_2");

                        if (NXCore.isEmpty(vGubun) || vGubun < 1) {
                            alert(i + 1 + "행의 " + vItnbr + " 형번이 미허가 품목입니다.");
                            continue;
                        }
                    }//태국법인
                    else if (vs_Cvcod == '14836') {
                        vGubun = this.ds_Temp.getColumn(0, "GUBUN_3");

                        if (NXCore.isEmpty(vGubun) || vGubun < 1) {
                            alert(i + 1 + "행의 " + vItnbr + " 형번이 미허가 품목입니다.");
                            continue;
                        }
                    }//대만법인
                    else if (vs_Cvcod == '14846') {
                        vGubun = this.ds_Temp.getColumn(0, "GUBUN_4");

                        if (NXCore.isEmpty(vGubun) || vGubun < 1) {
                            alert(i + 1 + "행의 " + vItnbr + " 형번이 미허가 품목입니다.");
                            continue;
                        }
                    }
                }
                /////////////////////////////////////////////////////////////////////////////


                var vRet1 = this.gf_SelectSql_sync("ds_Temp: SELECT BUDSC "
                    + " FROM ITMBUY  "
                    + " WHERE ITNBR = '" + vItnbr + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

                //// 수량 check
                if (nOrder_qty <= 0) {
                    if (application.confirm("[" + vItnbr + "]" + "은 수량이 없습니다. \n계속진행하시겠습니다.") == false) {
                        return;
                    }
                    else {
                        continue;
                    }
                }

                //----------------------------------------------------------
                //// 추가
                //----------------------------------------------------------
                nIns = this.ds_Detail_1.addRow();

                this.ds_Detail_1.setColumn(nIns, "ITNBR", vItnbr);

                if (vRet1[0] == 0) {
                    this.ds_Detail_1.setColumn(nIns, "ITDSC", vRet[1]);
                }
                else {
                    this.ds_Detail_1.setColumn(nIns, "ITDSC", vRet1[1]);
                }

                this.ds_Detail_1.setColumn(nIns, "KITCHECK", '0');
                this.ds_Detail_1.setColumn(nIns, "ISPEC", vRet[2]);
                this.ds_Detail_1.setColumn(nIns, "UNMSR", vRet[3]);
                this.ds_Detail_1.setColumn(nIns, "OUT_GU", vIogbn);
                this.ds_Detail_1.setColumn(nIns, "PRODNM", vRet[5]);
                this.ds_Detail_1.setColumn(nIns, "ITTYP", vRet[4]);

                var vPspec = ".";

                //// 단가처리를 위한 필수 항목 check
                if (this.ff_Danga(this.ds_Detail_1, nIns, vItnbr, vPspec, nOrder_qty) == -1) {
                    this.ff_ClearItem(this.ds_Detail_1, nIns);
                }

                //-------------------------------------
                //// 판매단가 setting
                //-------------------------------------
                var nPrc = 0;
                nPrc = this.gf_sale_danga(vPidate, vCvcod, vItnbr, vCurr);

                if (NXCore.isEmpty(nPrc) || nPrc == '') {
                    nPrc = 0;
                }

                this.ds_Detail_1.setColumn(nIns, "JISI_QTY", nOrder_qty);
                this.ds_Detail_1.setColumn(nIns, "PROD_QTY", nOrder_qty);
                this.ds_Detail_1.setColumn(nIns, "ORDER_QTY", nOrder_qty);
                this.ds_Detail_1.setColumn(nIns, "PIPRC", nOrder_prc);
                this.ds_Detail_1.setColumn(nIns, "ORDER_PSPEC", '.');
                this.ds_Detail_1.setColumn(nIns, "DEPOT_NO", 'ZA161');
                this.ds_Detail_1.setColumn(nIns, "SUGUGB", '1');
                this.ds_Detail_1.setColumn(nIns, "PANGB", '1');
                this.ds_Detail_1.setColumn(nIns, "AMTGU", 'Y');
                this.ds_Detail_1.setColumn(nIns, "SUJU_STS", '1');
                this.ds_Detail_1.setColumn(nIns, "HOLD_QTY", 0);
                this.ds_Detail_1.setColumn(nIns, "INVOICE_QTY", 0);
                this.ds_Detail_1.setColumn(nIns, "OUT_QTY", 0);
                this.ds_Detail_1.setColumn(nIns, "CIQTY", 0);
                this.ds_Detail_1.setColumn(nIns, "MISAYU", vBigo);

                if (this.ff_Calamt(this.ds_Detail_1, nIns, nPrc, nOrder_qty) == -1) {
                    this.ds_Detail_1.setColumn(nIns, "JISI_QTY", nOrder_qty);
                    this.ds_Detail_1.setColumn(nIns, "ORDER_QTY", nOrder_qty);

                }

                this.ds_Detail_1.setColumn(nIns, "PIAMT", nexacro.round(nOrder_prc * nOrder_qty, 2));
                this.ds_Detail_1.setColumn(nIns, "CUST_NAPGI", this.ds_Detail.getColumn(0, "SHIPREQ"));

                var vs_Sql = " SELECT 	NVL(FUN_GET_SORDER_TOTAL_QTY('" + vPidate + "','" + vCvcod + "','" + vItnbr + "'),0) AS DEPT_ORDER_QTY, ";
                vs_Sql += " 		NVL(FUN_GET_REQ_TOTAL_QTY('" + vPidate + "','" + vCvcod + "','" + vItnbr + "'),0) AS DEPT_REQ_QTY ";
                vs_Sql += " FROM DUAL ";

                this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT_TOTAL_QTY", "ff_Callback_sync");
                if (vi_ErrorCode < 0) return;

                this.ds_Detail_1.setColumn(nRow2, "DEPT_ORDER_QTY", this.ds_Temp.getColumn(0, "DEPT_ORDER_QTY"));
                this.ds_Detail_1.setColumn(nRow2, "DEPT_REQ_QTY", this.ds_Temp.getColumn(0, "DEPT_REQ_QTY"));

                ////  KIT 상품 여부 확인 
                vs_kitcnt = this.gf_SelectSql_sync("ds_Temp: Select count(*) from itemas_mrp where itnbr = '" + vItnbr + "' and containgu = 'Y'  ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
                if (vs_kitcnt[1] > 0) {
                    this.ds_Detail_1.setColumn(nIns, "KITCHECK", '1');
                } else {
                    this.ds_Detail_1.setColumn(nIns, "KITCHECK", '0');
                }

                //** 문석
                var vs_cnt2 = this.gf_SelectSql_sync("ds_Temp: Select count(*) from itemas_set where itnbr = '" + vItnbr + "' ", "SELECT_SETCHECK", "ff_Callback_sync", 0);
                if (vs_cnt2[1] > 0) {
                    this.ds_Detail_1.setColumn(nIns, "SETCHECK", '1');
                } else {
                    this.ds_Detail_1.setColumn(nIns, "SETCHECK", '0');
                }

            }
            if (vs_kitcnt[1] > 0)	// KIT 상품 확인메시지(KIT 하나라도 있을 때)
            {
                alert("KIT 상품이 있습니다. 구성품을 확인해주십시오.\n빨간 글씨 더블클릭 시 KIT 구성품 등록");
            }


            //** 문석
            if (vs_cnt2[1] > 0) {
                alert("SET 상품이 있습니다. 구성품을 확인해주십시오.\n파란 글씨 더블클릭 시 SET 구성품 등록");
            }

            this.ff_total_qty();
            this.ds_Detail_1.set_enableevent(true);

            //------------------------------------------------------
            //// 메세지 처리
            //------------------------------------------------------
            alert("EXCEL UPLOAD 처리 완료");

            break;

        case "co_pop_itemas_4_detail_rbtn":
            var vn_Row, nRow2, vItnbr;
            var vi_Row = this.ds_Detail_1.rowposition;
            var vs_ittyp = this.ds_Head.getColumn(0, "ARG_ITTYP");
            var vs_ittypChk = '1';

            var vOut_gu = this.ds_Detail_1.getColumn(vi_Row, "OUT_GU");
            if (NXCore.isEmpty(vOut_gu) || vOut_gu == '') {
                vOut_gu = "O02";
            }

            if (NXCore.isEmpty(this.ds_Detail.getColumn(0, "FACTORY")) || this.ds_Detail.getColumn(0, "FACTORY") == '') {
                vs_ittypChk = '0';
            } //과거 PI 변경에 대해서는 품목 체크 X

            var vPidate = this.ds_Head.getColumn(0, "ARG_SDATE");
            var vCvcod = this.ds_Head.getColumn(0, "ARG_CVCOD");

            this.ds_Detail_1.set_enableevent(false);

            for (var i = 0; i < va_data.length; i++) {
                vItnbr = va_data[i][2];

                if (va_data[i][10] != '0') {
                    alert(va_data[i][0] + " 사용할 수 없는 품번입니다.");
                    continue;
                }
                if (vs_ittypChk == '1') //품목구분 체크
                {
                    if (va_data[i][17] != vs_ittyp) {
                        alert("제품/상품 구분이 맞지 않습니다.\n" + vItnbr + " 형번.");
                        continue;
                    }
                }
                if (i > 0) {
                    nRow2 = this.ds_Detail_1.addRow();
                }
                else {
                    nRow2 = this.ds_Detail_1.rowposition;
                }

                var vRet2 = this.gf_SelectSql_sync("ds_Temp: SELECT BUDSC "
                    + " FROM ITMBUY  "
                    + " WHERE ITNBR = '" + vItnbr + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

                if (NXCore.isEmpty(vRet2[1]) || vRet2[1] == '') {
                    this.ds_Detail_1.setColumn(nRow2, "ITDSC", va_data[i][4]);
                }
                else {
                    this.ds_Detail_1.setColumn(nRow2, "ITDSC", vRet2[1]);
                }
                this.ds_Detail_1.setColumn(nRow2, "ITNBR", vItnbr);
                this.ds_Detail_1.setColumn(nRow2, "PRODNM", va_data[i][3]);
                this.ds_Detail_1.setColumn(nRow2, "ISPEC", va_data[i][5]);
                this.ds_Detail_1.setColumn(nRow2, "UNMSR", va_data[i][7]);
                this.ds_Detail_1.setColumn(nRow2, "CUST_NAPGI", this.ds_Detail.getColumn(0, "SHIPREQ"));

                this.ds_Detail_1.setColumn(nRow2, "OUT_GU", vOut_gu);
                this.ds_Detail_1.setColumn(nRow2, "ORDER_PSPEC", '.');
                this.ds_Detail_1.setColumn(nRow2, "DEPOT_NO", 'ZA161');
                this.ds_Detail_1.setColumn(nRow2, "SUGUGB", '1');
                this.ds_Detail_1.setColumn(nRow2, "PANGB", '1');
                this.ds_Detail_1.setColumn(nRow2, "AMTGU", 'Y');
                this.ds_Detail_1.setColumn(nRow2, "PISTS", '1');
                this.ds_Detail_1.setColumn(nRow2, "ITTYP", va_data[i][17]);

                var vCurr = this.ds_Detail.getColumn(0, "TUNCU");
                vCurr = "2" + vCurr;

                //// 판매단가

                var nPrc = this.gf_sale_danga(vPidate, vCvcod, vItnbr, vCurr);

                this.ds_Detail_1.setColumn(nRow2, "PIPRC", nPrc);

                var nOrder_qty = this.ds_Detail_1.getColumn(nRow2, "ORDER_QTY");

                this.ds_Detail_1.setColumn(nRow2, "PIAMT", nexacro.round(nOrder_qty * nPrc, 2));

                var vs_Sql = " SELECT 	NVL(FUN_GET_SORDER_TOTAL_QTY('" + vPidate + "','" + vCvcod + "','" + vItnbr + "'),0) AS DEPT_ORDER_QTY, ";
                vs_Sql += " 		NVL(FUN_GET_REQ_TOTAL_QTY('" + vPidate + "','" + vCvcod + "','" + vItnbr + "'),0) AS DEPT_REQ_QTY ";
                vs_Sql += " FROM DUAL ";

                this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT_TOTAL_QTY", "ff_Callback_sync");
                if (vi_ErrorCode < 0) return;

                this.ds_Detail_1.setColumn(nRow2, "DEPT_ORDER_QTY", this.ds_Temp.getColumn(0, "DEPT_ORDER_QTY"));
                this.ds_Detail_1.setColumn(nRow2, "DEPT_REQ_QTY", this.ds_Temp.getColumn(0, "DEPT_REQ_QTY"));

                ////  KIT 구성품 popup
                var vs_cnt = this.gf_SelectSql_sync("ds_Temp: Select count(*) from itemas_mrp where itnbr = '" + vItnbr + "' and containgu = 'Y'  ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

                if (vs_cnt[1] > 0) {
                    this.ff_co_popu_itemaskit_f("co_popu_itnkit", vItnbr);
                    this.ds_Detail_1.set_enableevent(true);
                    break;
                }
                //** 문석
                var vs_cnt2 = this.gf_SelectSql_sync("ds_Temp: Select count(*) from itemas_set where itnbr = '" + vItnbr + "' ", null, null, 0);

                if (vs_cnt2[1] > 0) {
                    this.ff_co_popu_itemaskit_f("co_popu_itnset", vItnbr);
                }

                this.ds_Detail_1.set_enableevent(true);
                break;
            }

            this.ds_Detail_1.set_enableevent(true);
            break;
        case "co_popu_itnkit":
            var vfind = 0;
            var vs_sql;
            var vOut_gu = "O18";
            //			var vOut_gu = this.ds_Detail_1.getColumn(this.ds_Detail_1.rowposition,"OUT_GU");
            //			if (NXCore.isEmpty(vOut_gu) || vOut_gu == '') 
            //			{
            //				vOut_gu = "O02";
            //			}

            for (var i = 0; i < va_data.length; i++) {
                var vItnbr = this.ds_Detail_1.getColumn(this.ds_Detail_1.rowposition, "ITNBR");

                var vs_unmsr = this.gf_SelectSql_sync("ds_Temp: Select UNMSR from itemas where itnbr = '" + va_data[i][0] + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
                if (va_data[i][0] == vItnbr) {
                    var vInsrow;
                    vInsrow = this.ds_Detail_1.rowposition;
                    vfind = this.ds_Detail_1.findRow("ITNBR", va_data[i][0]);

                    this.ds_Detail_1.set_enableevent(false);
                    this.ds_Detail_1.setColumn(vfind, "ITNBR", va_data[i][0]);
                    this.ds_Detail_1.setColumn(vfind, "DEPOT_NO", 'ZA161');
                    this.ds_Detail_1.setColumn(vfind, "OUT_GU", vOut_gu);
                    this.ds_Detail_1.setColumn(vfind, "PIPRC", va_data[i][1]);
                    this.ds_Detail_1.setColumn(vfind, "UNMSR", vs_unmsr[1]);
                    this.ds_Detail_1.setColumn(vfind, "SUGUGB", '1');
                    this.ds_Detail_1.setColumn(vfind, "PANGB", '1');
                    this.ds_Detail_1.setColumn(vfind, "AMTGU", 'N');

                    this.ds_Detail_1.set_enableevent(true);
                }
                else {
                    var vInsrow;
                    vInsrow = this.ds_Detail_1.rowposition;
                    vInsrow = this.ds_Detail_1.addRow();
                    this.ds_Detail_1.setColumn(vInsrow, "ITNBR", va_data[i][0]);
                    this.ds_Detail_1.setColumn(vInsrow, "DEPOT_NO", 'ZA161');
                    this.ds_Detail_1.setColumn(vInsrow, "OUT_GU", vOut_gu);
                    this.ds_Detail_1.setColumn(vInsrow, "PIPRC", va_data[i][1]);
                    this.ds_Detail_1.setColumn(vInsrow, "UNMSR", vs_unmsr[1]);
                    this.ds_Detail_1.setColumn(vInsrow, "SUGUGB", '1');
                    this.ds_Detail_1.setColumn(vInsrow, "PANGB", '1');
                    this.ds_Detail_1.setColumn(vInsrow, "AMTGU", 'N');


                }

            }

            break;

        //** 문석
        case "co_popu_itnset":
            var vfind = 0;
            var vOut_gu = "O18";

            for (var i = 0; i < va_data.length; i++) {
                var vItnbr = this.ds_Detail_1.getColumn(this.ds_Detail_1.rowposition, "ITNBR");

                var vs_unmsr = this.gf_SelectSql_sync("ds_Temp: Select UNMSR from itemas where itnbr = '" + va_data[i][0] + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);
                if (va_data[i][0] == vItnbr) {
                    var vInsrow;
                    vInsrow = this.ds_Detail_1.rowposition;
                    vfind = this.ds_Detail_1.findRow("ITNBR", va_data[i][0]);

                    this.ds_Detail_1.set_enableevent(false);
                    this.ds_Detail_1.setColumn(vfind, "ITNBR", va_data[i][0]);
                    this.ds_Detail_1.setColumn(vfind, "DEPOT_NO", 'ZA161');
                    this.ds_Detail_1.setColumn(vfind, "OUT_GU", vOut_gu);
                    this.ds_Detail_1.setColumn(vfind, "PIPRC", va_data[i][1]);
                    this.ds_Detail_1.setColumn(vfind, "UNMSR", vs_unmsr[1]);
                    this.ds_Detail_1.setColumn(vfind, "SUGUGB", '1');
                    this.ds_Detail_1.setColumn(vfind, "PANGB", '1');
                    this.ds_Detail_1.setColumn(vfind, "AMTGU", 'N');

                    this.ds_Detail_1.set_enableevent(true);
                }
                else {
                    var vInsrow;
                    vInsrow = this.ds_Detail_1.rowposition;
                    vInsrow = this.ds_Detail_1.addRow();
                    this.ds_Detail_1.setColumn(vInsrow, "ITNBR", va_data[i][0]);
                    this.ds_Detail_1.setColumn(vInsrow, "DEPOT_NO", 'ZA161');
                    this.ds_Detail_1.setColumn(vInsrow, "OUT_GU", vOut_gu);
                    this.ds_Detail_1.setColumn(vInsrow, "PIPRC", va_data[i][1]);
                    this.ds_Detail_1.setColumn(vInsrow, "UNMSR", vs_unmsr[1]);
                    this.ds_Detail_1.setColumn(vInsrow, "SUGUGB", '1');
                    this.ds_Detail_1.setColumn(vInsrow, "PANGB", '1');
                    this.ds_Detail_1.setColumn(vInsrow, "AMTGU", 'N');


                }

            }

            break;
            return;
    }
}

// 입력모드 선택시 처리
this.ff_input_mode = function (sMode) {
    var vs_Today = this.gf_today();

    input_Mode = sMode;

    this.ff_SetCondition();
}

this.ff_SujuSts = function (vDw, vRow) {
    var vPino, vSuju_sts, vAgrdat;
    var nOrdqty = 0, nHoldqty = 0, nJisiqty = 0, nProdqty = 0;

    var vSql;
    var vRet;

    //--------------------------------------
    //// 수주상태 확인
    //--------------------------------------
    if (vRow < 0) {
        return -1;
    }

    //----------------------------------------
    //// CI에 연결된 건은 삭제 불가
    //----------------------------------------
    vPino = vDw.getColumn(vRow, "ORDER_NO");


    vRet = this.gf_SelectSql_sync("ds_Temp: SELECT nvl(max(CINO), ''), "
        + "        nvl(sum(CIQTY), 0)  "
        + " FROM EXPCID                "
        + " WHERE ORDER_NO = '" + vPino + "'", "SELECT_reffpf_5A", "ff_Callback_sync", 0);


    ivChk = "2"; //// False

    if (NXCore.isEmpty(vRet[1]) || vRet[1] == '') {
        ivChk = "2"; ////False
    }
    else {
        ivChk = "1";  ////True
        return vRet[2];
    }

    vSuju_sts = vDw.getColumn(vRow, "SUJU_STS");

    if (vSuju_sts == '3') {
        return -2;
    }
    else if (vSuju_sts == '4' || vSuju_sts == '8' || vSuju_sts == '9') {
        return -1;
    }
    else {
        nOrdqty = vDw.getColumn(vRow, "ORDER_QTY"); //// 수주수량 합
        nHoldqty = vDw.getColumn(vRow, "HOLD_QTY"); //// 할당수량 합
        nJisiqty = vDw.getColumn(vRow, "JISI_QTY"); //// 생산지시수량 합
        nProdqty = vDw.getColumn(vRow, "PROD_QTY"); //// 생산입고수량 합
        vAgrdat = vDw.getColumn(vRow, "AGRDAT"); //// 생산승인일자

        if (NXCore.isEmpty(nOrdqty) || nOrdqty == '') {
            nOrdqty == 0;
        }

        if (NXCore.isEmpty(nHoldqty) || nHoldqty == '') {
            nHoldqty == 0;
        }

        if (NXCore.isEmpty(nJisiqty) || nJisiqty == '') {
            nJisiqty == 0;
        }

        if (NXCore.isEmpty(nProdqty) || nProdqty == '') {
            nProdqty == 0;
        }

        if (NXCore.isEmpty(vAgrdat) || vAgrdat == '') {
            vAgrdat == "";
        }

        if (nHoldqty != 0) {
            return Math.abs(nHoldqty + nJisiqty - nProdqty);
        }
        else {
            return 0;
        }
    }
}

this.ff_Danga = function (vDw, vRow, vData, vPspec, nQty) {
    var vPidate, vCvcod, vCurr, vPrcgb;
    var vAmtgu;

    var vSql;
    var vResult;

    vPidate = this.ds_Head.getColumn(0, "ARG_SDATE");
    vCvcod = this.ds_Head.getColumn(0, "ARG_CVCOD");
    vCurr = this.ds_Detail.getColumn(0, "TUNCU");

    if (NXCore.isEmpty(vPidate) || vPidate == '') {
        alert("발행일을 입력하세요!");
        this.div_Head.cal_Sdate.setFocus();
        return -1;
    }

    if (NXCore.isEmpty(vCvcod) || vCvcod == '') {
        alert("Buyer를 입력하세요!");
        this.div_Head.edt_Cvcod.setFocus();
        return -1;
    }

    if (NXCore.isEmpty(vCurr) || vCurr == '') {
        alert("통화단위를 입력하세요!");
        return -1;
    }

    //-------------------------------------
    //// 무상출고일 경우 단가 0
    //-------------------------------------
    vAmtgu = vDw.getColumn(vRow, "AMTGU");

    if (vAmtgu == "N") {
        vDw.setColumn(vRow, "DC_RATE", 0);
        vDw.setColumn(vRow, "ORDER_PRC", 0);
        vDw.setColumn(vRow, "PIPRC", 0);
        return 0;
    }

    //// 자국의 통화일 경우
    if (vCurr == ivCurr) {
        vPrcgb = "1";   //// 자국 통화 기준(예:WON, CNY)
    }
    else {
        vPrcgb = "2";   //// 외화
    }

    //--------------------------------------------------------
    //// 수량이 0이상일 경우 수량base단가, 할인율을 구한다
    //--------------------------------------------------------
    if (nQty > 0) {

        vResult = this.gf_SelectSql_sync("ds_Temp: SELECT FUN_ERP100000012_1('" + vPidate + "',  "
            + "                           '" + vCvcod + "',  "
            + "                           '" + vData + "',  "
            + "                           '2'||'" + vCurr + "') "
            + " FROM DUAL ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

        vDw.setColumn(vRow, "DC_RATE", 0);

    }

    return 0;
}

this.ff_HoldDel = function (vPino) {
    var vSaupj, vOrdcfdt;
    var vRet, vRet1, vRet2;

    //----------------------------------------------
    //// 자동할당 여부
    //----------------------------------------------
    vSaupj = this.ds_Head.getColumn(0, "ARG_SAUPJ");
    vOrdcfdt = this.ds_Head.getColumn(0, "ORDCFDT");


    vRet = this.gf_SelectSql_sync("ds_Temp: SELECT SUBSTR(DATANAME, 1, 1) "
        + " FROM SYSCNFG         "
        + " WHERE SYSGU  = 'S'   "
        + "   AND SERIAL = 1     "
        + "   AND LINENO = '50'  ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

    if (vRet[0] == 0 || vRet[1] == "Y") {
        //----------------------------------------------------------
        //// 할당자료의 진행이 할당 상태인 것에 한하여 삭제가능
        //----------------------------------------------------------

        vRet1 = this.gf_SelectSql_sync("ds_Temp: SELECT nvl(count(*), 0) "
            + " FROM HOLDSTOCK          "
            + " WHERE ORDER_NO LIKE '" + vPino + "'||'%' "
            + "   AND OUT_CHK > '1'    ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

        if (vRet1[1] > 0) {
            alert("이미 송장이 발행된 내역이 있습니다. 삭제불가!");
            return -1;
        }

        var vSql_ins = " DELETE FROM HOLDSTOCK "
            + " WHERE ORDER_NO LIKE '" + vPino + "'||'%' ";

        this.gf_UpdateSql_sync(vSql_ins, 'UPDATE_SQL', "ff_Callback_sync", 0);
    }
    else {
        //-----------------------------------------------------
        //// 자동할당이 아닐 경우. 할당자료가 있으면 삭제불가.
        //-----------------------------------------------------

        vRet2 = this.gf_SelectSql_sync("ds_Temp: SELECT nvl(count(*), 0) "
            + " FROM HOLDSTOCK          "
            + " WHERE ORDER_NO LIKE '" + vPino + "'||'%'  ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

        if (vRet2[1] > 0) {
            alert("할당자료가 존재합니다. 할당자료부터 삭제하세요!");
            return -1;
        }
    }
    return 0;
}

this.ff_AutoHold = function (vPino) {
    var vSaupj, vOrdcfdt;
    var vRet;
    var vRet1;

    //// 자동할당 여부
    vSaupj = this.ds_Head.getColumn(0, "ARG_SAUPJ");
    vOrdcfdt = this.ds_Head.getColumn(0, "ORDCFDT");

    vRet = this.gf_SelectSql_sync("ds_Temp: SELECT SUBSTR(DATANAME, 1, 1) "
        + " FROM SYSCNFG        "
        + " WHERE SYSGU = 'S'   "
        + "   AND SERIAL = 1    "
        + "   AND LINENO = '50'  ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

    if (vRet[0] == 0 || vRet[1] == "Y") {
        var vArgspro = vSaupj + "|" + vOrdcfdt + "|" + vPino;

        vRet1 = this.gf_Procedure_sync("erp100000040", vArgspro, "PROCEDURE", "ff_Callback_sync", 0);

        /*if (vRet1[0] == 0)
        {
            alert("할당된 건수가 없습니다.");
            return -1;
        }
        else if (vRet1[1] > 0)
        {
            alert(vRet1[1] + " 건의 할당자료을 생성했습니다.");
        }*/
    }
    return 0;
}

this.ff_ClearItem = function (vDw, vRow) {
    vDw.setColumn(vRow, "ITNBR", '');
    vDw.setColumn(vRow, "ITDSC", '');
    vDw.setColumn(vRow, "ISPEC", '');
    vDw.setColumn(vRow, "PSPEC", '.');
    vDw.setColumn(vRow, "UNMSR", '');
    vDw.setColumn(vRow, "ORDER_QTY", 0);
    vDw.setColumn(vRow, "DC_RATE", 0);
    vDw.setColumn(vRow, "ORDER_PRC", 0);
    vDw.setColumn(vRow, "ORDER_AMT", 0);

    return;
}

this.Tab00_tabpage2_grd_Detail_1_onkeydown = function (obj: Grid, e: nexacro.KeyEventInfo) {

    if (e.keycode == '13') {
        this.parent.parent.div_btnList.setFocus();
        var vi_currentcol = obj.currentcol;
        var vi_row = obj.currentrow;

        obj.setFocus();
        obj.clearSelect();

        var vs_DsObj = eval("this." + obj.binddataset);
        var vi_tot_row = vs_DsObj.rowcount;
        if (vi_tot_row > vi_row + 1) {
            obj.selectRow(vi_row + 1, true);
            obj.setCellPos(vi_currentcol);
        }
        else {
            obj.selectRow(vi_row, true);
            obj.setCellPos(vi_currentcol);
        }
    }
}



this.ff_Object_oncelldblclick = function (obj: Grid, e: nexacro.GridClickEventInfo) 	// 탭 2  더블 클릭 시 이벤트
{
    var vs_Data = e.postvalue;
    var vs_Arg = '';
    var vn_row = e.row;

    if (obj.readonly) return;		//readonly 상태 이면 팝업 취소 

    // Grid과 다른 object로 나눠서 처리 
    // obj가 Grid를 확인해서 처리함	
    if (obj == '[object Grid]') {
        if ('grd_Detail_1') {
            switch (this.gf_GetCellBind(obj, e.cell, 'Body')) {
                case 'ITNBR':
                    var vs_itnbr, vs_kitcheck;

                    vs_itnbr = this.ds_Detail_1.getColumn(vn_row, "ITNBR");
                    vs_kitcheck = this.ds_Detail_1.getColumn(vn_row, "KITCHECK");
                    //** 문석    
                    vs_setcheck = this.ds_Detail_1.getColumn(vn_row, "SETCHECK");
                    if (vs_kitcheck == "1")	//KIT 상품일 때, KIT 구성품 팝업
                    {
                        this.ff_co_popu_itemaskit_f("co_popu_itnkit", vs_itnbr);
                        //this.ds_Detail_1.setColumn(e.row,"KITCHECK", '0');
                    //** 문석    
                    } else if (vs_setcheck == "1"){
                        this.ff_co_popu_itemaskit_f("co_popu_itnset", vs_itnbr);
                        // this.ds_Detail_1.setColumn(e.row,"SETCHECK", '0');
                    } else {
                        return;
                    }
                    break;
            }
        }
    }
    else {
        return;
    }

}

this.ff_total_qty = function () {
    if (this.ds_Detail_1.rowcount != 0) {
        var vs_Sdate = this.ds_Head.getColumn(0, "ARG_SDATE");
        var vs_Cvcod = this.ds_Head.getColumn(0, "ARG_CVCOD");

        this.ds_Detail_1.set_enableevent(false);

        for (var i = 0; i < this.ds_Detail_1.rowcount; i++) {
            var vs_Itnbr = this.ds_Detail_1.getColumn(i, "ITNBR");

            var vs_Sql = " SELECT 	NVL(FUN_GET_SORDER_TOTAL_QTY('" + vs_Sdate + "','" + vs_Cvcod + "','" + vs_Itnbr + "'),0) AS DEPT_ORDER_QTY, ";
            vs_Sql += " 		NVL(FUN_GET_REQ_TOTAL_QTY('" + vs_Sdate + "','" + vs_Cvcod + "','" + vs_Itnbr + "'),0) AS DEPT_REQ_QTY ";
            vs_Sql += " FROM DUAL ";

            this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT_TOTAL_QTY", "ff_Callback_sync");
            if (vi_ErrorCode < 0) return;

            this.ds_Detail_1.setColumn(i, "DEPT_ORDER_QTY", this.ds_Temp.getColumn(0, "DEPT_ORDER_QTY"));
            this.ds_Detail_1.setColumn(i, "DEPT_REQ_QTY", this.ds_Temp.getColumn(0, "DEPT_REQ_QTY"));


        }

        this.ds_Detail_1.set_enableevent(true);
    }
}

this.ff_save_qty_chk = function () {
    // 저장 전 한번 더 수량 확인
    this.ff_total_qty();

    var v_Sdate = this.gf_addmonths(this.ds_Head.getColumn(0, "ARG_SDATE"), -4).substr(0, 6);
    var v_Edate = this.gf_addmonths(this.ds_Head.getColumn(0, "ARG_SDATE"), -1).substr(0, 6);
    var v_Cvcod = this.ds_Head.getColumn(0, "ARG_CVCOD");

    // P/I는 영업소 코드로 들어가기 때문에 DEPTCODE 출력 - 시작
    var v_DeptCode = '';

    var vs_Sql = " SELECT 	C.DEPTCODE ";
    vs_Sql += " FROM 	VNDMST A, VNDMST_SUB B, SAREA C ";
    vs_Sql += " WHERE	A.CVCOD = B.CVCOD AND B.SAREA = C.SAREA AND A.CVCOD = '" + v_Cvcod + "' ";

    this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT_DEPTCODE", "ff_Callback_sync");
    if (vi_ErrorCode < 0) return;

    if (this.ds_Temp.rowcount != 0) {
        v_DeptCode = this.ds_Temp.getColumn(0, "DEPTCODE");
    }
    // P/I는 영업소 코드로 들어가기 때문에 DEPTCODE 출력 - 끝

    // 팀별 생산요청 수량 대 주문+출고수량 체크 로직 - 시작
    if (this.ds_Detail_1.rowcount != 0) // 품목정보 존재 유무 확인 - 시작
    {
        // 품목정보 등록 시 추가, 수정 요청수량 및 주문/출고수량, 팀별 생산요청 수량 합계 구하기(중복 포함) - 시작
        for (i = 0; i < this.ds_Detail_1.rowcount; i++) {

            vi_Row = this.ds_Detail_1.findRowExpr("(this.getRowType(rowidx)==4)||(this.getRowType(rowidx)==2)", i);

            if (vi_Row < 0) break;

            i = vi_Row;

            // 팀별 생산요청 수량 존재 유무 확인 없으면 다음 row 체크 - 시작
            var vItnbr = this.ds_Detail_1.getColumn(i, "ITNBR");

            var vs_Sql = " SELECT 	COUNT(*) AS CNT ";
            vs_Sql += " FROM 	SALE_PROD_REQUEST ";
            vs_Sql += " WHERE	REG_YYMM BETWEEN '" + v_Sdate + "' AND '" + v_Edate + "' ";
            vs_Sql += " AND		ITNBR	=	'" + vItnbr + "' ";
            vs_Sql += " AND		DEPTCODE	=	'" + v_DeptCode + "' ";
            vs_Sql += " AND		USEYN	=	'Y' ";


            this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT_EXISTS", "ff_Callback_sync");
            if (vi_ErrorCode < 0) return;

            if (this.ds_Temp.getColumn(0, "CNT") == 0 || NXCore.isEmpty(this.ds_Temp.getColumn(0, "CNT"))) {
                continue;
            }
            // 팀별 생산요청 수량 존재 유무 확인 없으면 다음 row 체크 - 끝

            // 중복건 요청수량 합계 구하기 - 시작
            var v_order_qty = 0; // 요청수량
            var v_befor_qty = 0; // 기 등록된 수량

            for (var j = 0; j < this.ds_Detail_1.rowcount; j++) {

                /*vi_Row2 = this.ds_Detail_1.findRowExpr("(this.getRowType(rowidx)==4)||(this.getRowType(rowidx)==2)",j); 
        	
                if (vi_Row2 < 0) break;
        	
                j=vi_Row2;*/

                var vItnbr2 = this.ds_Detail_1.getColumn(j, "ITNBR");
                if (vItnbr == vItnbr2) {
                    if (this.ds_Detail_1.getRowType(j) == '2' || this.ds_Detail_1.getRowType(j) == '4') {
                        v_order_qty = v_order_qty + this.ds_Detail_1.getColumn(j, "JISI_QTY");

                        // 기등록된 수량 구하기
                        if (this.ds_Detail_1.getRowType(j) == '4') {
                            var v_OrderNo = this.ds_Detail_1.getColumn(j, "ORDER_NO");

                            var vs_Sql = " SELECT ORDER_QTY ";
                            vs_Sql += " FROM 	SORDER ";
                            vs_Sql += " WHERE	ORDER_NO = '" + v_OrderNo + "' ";

                            this.gf_SelectSql_sync("ds_Temp : " + vs_Sql, "SELECT_EXISTS_ORDER_QTY", "ff_Callback_sync");
                            if (vi_ErrorCode < 0) return;

                            v_befor_qty = v_befor_qty + this.ds_Temp.getColumn(0, "ORDER_QTY");
                        }
                    }
                }
            }
            // 중복건 요청수량 합계 구하기 - 시작
            if (v_order_qty == 0) {
                v_order_qty = this.ds_Detail_1.getColumn(i, "JISI_QTY");
            }
            var v_deptOrdQty = this.ds_Detail_1.getColumn(i, "DEPT_ORDER_QTY");
            var v_deptReqQty = this.ds_Detail_1.getColumn(i, "DEPT_REQ_QTY");

            if (v_deptReqQty < ((nexacro.toNumber(v_deptOrdQty) + nexacro.toNumber(v_order_qty)) - nexacro.toNumber(v_befor_qty))) {
                alert("생산요청 수량보다 주문 및 출고수량이 더 많습니다. \n 형번 : " + vItnbr + " // 생산요청 수량 : " + v_deptReqQty + " // 주문 및 출고 수량 : " + v_deptOrdQty);
                return 'N';
            }

        }
        // 품목정보 등록 시 추가, 수정 요청수량 및 주문/출고수량, 팀별 생산요청 수량 합계 구하기(중복 포함) - 끝
    }
    // 품목정보 존재 유무 확인 - 끝
    return 'Y';
    // 팀별 생산요청 수량 대 주문+출고수량 체크 로직 - 끝
}

this.fn_checkdata = function () {
    if (this.ds_Detail_1.getDeletedRowCount() > 0) { // 삭제된 데이터가 있다면,
        return true;
    }

    for (var i = 0; i < this.ds_Detail_1.rowcount; i++) {
        var nRowType = this.ds_Detail_1.getRowType(i);
        if (nRowType == 2 || nRowType == 8) { // 신규나 삭제된게 있다면,
            return true;
        } else if (nRowType == 4) {
            // 변경된 후 데이터
            var sCurDataitnbr = this.ds_Detail_1.getColumn(i, "ITNBR");

            // 변경되기 전 데이터
            var sOrgDataitnbr = this.ds_Detail_1.getOrgColumn(i, "ITNBR");
            // 변경된 후 데이터
            var sCurDatajisi = this.ds_Detail_1.getColumn(i, "JISI_QTY");

            // 변경되기 전 데이터
            var sOrgDatajisi = this.ds_Detail_1.getOrgColumn(i, "JISI_QTY");

            if (sCurDataitnbr != sOrgDataitnbr || sCurDatajisi != sOrgDatajisi) {
                return true;
            }
        }
    }

    return false;
}