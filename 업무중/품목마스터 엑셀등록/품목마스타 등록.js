/***********************************************************************
 * 01. Creation date      : 2015.06.08
 * 02. Created by         : 원현욱
 * 03. Revision history   : 
 * ds_List  ==> ITEMAS, ITEMAS_TCPRC, ITEMAS_MRP, ITEMAS_DSIP 에서 모두 처리 함.
 * 품번 등록시 ITEMAS_TCPRC, ITEMAS_MRP, ITEMAS_DSIP도 동시에 입력, 삭제처리함.
 * ds_Cust_item ==> ITEMAS_ITMBUY 처리
 * ITEMAS_QC는 ITEMAS trigger에서 처리 됨
 ************************************************************************/

/*************************************************************************************************************
* 프로그램 필수 
*************************************************************************************************************/
include "lib::common_form.xjs";
include "lib::NXSub1.xjs";

//item changed를 통해 쿼리가 변경 될 경우 사용, 아닐경우 ff_Tran()에서 직접 입력
var pvs_SvcAct, pvs_Save_SvcAct;
var pvs_OutDataset, pvs_InDataset, pvs_Save_OutDataset, pvs_Save_InDataset;

this.vi_ErrorCode = undefined;     // 콜백루틴의 에러코드        싱크트란잭션일경우 사용
this.vs_ErrorMsg = undefined;      // 콜백루틴의 에러메세지    싱크트란잭션일경우 사용

var pvs_mode;					 // 등록, 삭제모드 
var fvs_sys53_1;                 // 환경변수 1, 2, 3; 생산계획 및 생산조직 구분(1:생산팀, 2:반, 3:작업장)
var fvs_prc_ds = "ds_List";
var fvs_delete_sql = '';

this.pvs_arg;
this.pvs_arg1;
this.pvs_arg2;

// on load event  페이지가 열릴때
this.form_onload = function (obj: Form, e: nexacro.LoadEventInfo) {
    this.gf_formOnload(obj);
    this.ff_load(obj);
    this.parent.parent.div_btnList.ButtonInfo = 'file_upload,첨부파일';
    this.parent.parent.div_btnList.ff_add_button();
}
//  초기 작업 수행
this.ff_load = function (obj) {

    this.ff_SetCondition();   // 초기 조건 파라메터 셋팅밍 콤보 셋팅

}

// 초기 조건 파라메터 셋팅밍 콤보 셋팅
this.ff_SetCondition = function () {
    pvs_mode = 'I';
    this.ff_form_init(pvs_mode);
}

// 프로그램 초기값 세팅
this.ff_form_init = function (vs_mode) {
    var vs_sql;
    //trace(this.ds_Head.saveXML());
    //ITEM CHANGED로 인해 쿼리 변경 될 때 이용
    //초기 쿼리랑 데이터셋 정의 
    // pvs_SvcAct		= "bi/item/bi_item_itemas_e_1q.jsp"; 

    //trace(this.ds_Head.saveXML());
    pvs_SvcAct = "bi/item/bi_item_itemas_neo_e_1q.jsp";

    pvs_OutDataset = "ds_List=output1";  // 반드시 output1으로 기술할것		   
    pvs_InDataset = "ds_para=ds_Head";

    // 기본 저장 위치 RUNNEOHQ으로 저장으로 NEODEV1 개발 테스트 시 주의 필요!!!!!!  	
    pvs_Save_SvcAct = "bi/item/bi_item_itemas_e_1tr.jsp?dbconn=2";
    //pvs_Save_SvcAct = "bi/item/bi_item_itemas_e_1tr.jsp?dbconn=0"; 


    pvs_Save_InDataset = "input1=ds_List:U input2=ds_List:U input3=ds_List:U input4=ds_List:U input5=ds_List:U";
    pvs_Save_OutDataset = ""
    // 초기 값 세팅
    // 콤보 데이타셋 조회 
    this.ds_Head.clearData();
    this.ds_Head.addRow();
    // combo 세팅 argumnet 5번자리 : @A 전체 포함, @N null 포함
    this.gf_combo_head_sync(this.ds_Head, "ARG_ITTYP", this.Div_Head.cbo_ittyp, "co_dddw_reffpf_f_05", "", 0);
    this.gf_combo_head_sync(this.ds_Head, "ARG_SAUPJ", this.Div_Head.cbo_saupj, "co_dddw_reffpf_f_ad1", "@A", 0);

    this.gf_combo_head_sync(this.ds_List, "ITTYP", this.Tab00.tabpage1.Div_Detail.cbo_ittyp2, "co_dddw_reffpf_f_05", "", 0);

    // 2018.04.18 KSM 담당자 >> PDM 상태 0:PDM전송, 1:ERP접수, NULL 미처리 상태 
    // this.gf_combo_head_sync(this.ds_List,"EMPNO2",this.Tab00.tabpage1.Div_Detail.cbo_empno2,"co_dddw_reffpf_f_46","|@N",0);	
    this.gf_combo_head_sync(this.ds_List, "EMPNO2", this.Tab00.tabpage1.Div_Detail.cbo_empno2, "0^PDM 전송@1^ERP 접수", "|@N", 0);


    //this.gf_combo_head_sync(this.ds_List,"GRITU",this.Tab00.tabpage1.Div_Detail.cbo_gritu,"co_dddw_reffpf_f_01","|@N",0);	
    //this.gf_combo_head_sync(this.ds_List,"MDL_JIJIL",this.Tab00.tabpage1.Div_Detail.cbo_mdl_jijil,"co_dddw_reffpf_f_1h","|@N",0);		
    //this.gf_combo_head_sync(this.ds_List,"ENGNO",this.Tab00.tabpage1.Div_Detail.cbo_engno,"co_dddw_reffpf_f_1f","|@N",0);

    //this.gf_combo_head_sync(this.ds_List,"JAJAETYPE",this.Tab00.tabpage1.Div_Detail.cbo_Jajaetype,"co_dddw_reffpf_f_e1","|@N",0);
    //this.gf_combo_head_sync(this.ds_List,"PERFORMANCE",this.Tab00.tabpage1.Div_Detail.cbo_Performance,"co_dddw_reffpf_f_e2","|@N",0);

    this.gf_combo_head_sync(this.ds_List, "ITTYP", this.Tab00.tabpage2.Div_Detail.cbo_ittyp3, "co_dddw_reffpf_f_05", "", 0);
    this.gf_combo_head_sync(this.ds_List, "EMPNO", this.Tab00.tabpage2.Div_Detail.cbo_empno, "co_dddw_reffpf_f_44", "|@N", 0);
    this.gf_combo_head_sync(this.ds_List, "UNMSR", this.Tab00.tabpage2.Div_Detail.cbo_unmsr, "co_dddw_reffpf_f_20", "|@N", 0);
    this.gf_combo_head_sync(this.ds_List, "ACCOD", this.Tab00.tabpage2.Div_Detail.cbo_accod, "co_dddw_kfz01omo", "|@N", 0);
    this.gf_combo_head_sync(this.ds_List, "ABCGB", this.Tab00.tabpage2.Div_Detail.cbo_abcgb, "co_dddw_reffpf_f_11", "|@N", 0);
    this.gf_combo_head_sync(this.ds_List, "CAL_UNIT", this.Tab00.tabpage2.Div_Detail.cbo_cal_unit, "co_dddw_reffpf_f_20", "|@N", 0);

    this.gf_combo_head_sync(this.ds_List, "ITTYP", this.Tab00.tabpage3.Div_Detail.cbo_ittyp4, "co_dddw_reffpf_f_05", "", 0);
    this.gf_combo_head_sync(this.ds_List, "FACGBN", this.Tab00.tabpage1.Div_Detail.cbo_facgbn, "co_dddw_reffpf_f", "1G|@N", 0);

    this.gf_combo_head_sync(this.ds_List, "ITTYP", this.Tab00.tabpage7.Div_Detail.cbo_ittyp5, "co_dddw_reffpf_f_05", "", 0);

    //this.gf_combo_grd_sync(this.grd_Master,"HOLD_STORE","co_dddw_depot_f_01","",0);

    this.ds_Head.set_enableevent(false);
    //로그인 사업장에 따른 사업장 체크  
    this.gf_check_saupj(this.Div_Head.cbo_saupj);
    this.ds_Head.setColumn(0, "ARG_SAUPJ", application.gvs_defsaupj);
    this.ds_Head.setColumn(0, "ARG_ITTYP", '1');
    this.ds_Head.setColumn(0, "ARG_USEYN", '%');
    this.ds_Head.setColumn(0, "ARG_LOGIN_EMPNO", application.gvs_userid);

    // 등록&수정모드에 따른 사용 	 
    switch (vs_mode) {
        //입력모드 
        case "I":
            //this.btn_query_onclick();
            break;
        //수정모드  
        case "M":
            break;
    }

    fvs_sys53_1 = this.gf_Getsyscnfg("Y", 53, "1");
    // select * from SYSCNFG where sysgu='Y' and serial='53'	-- 3
    // 품목에 대한 생산조직Level구분 --> 생산계획 및 생산조직 구분(1:생산팀, 2:반, 3:작업장)

    this.ds_Head.setColumn(0, "ARG_PDT_GBN", fvs_sys53_1);	// 3 
    // ARG_PDT_GBN - 3 작업장 고정.

    var v_sysM1_1 = this.gf_Getsyscnfg("M", 1, "1");
    // select * from SYSCNFG where sysgu='M' and serial='1'	and lineno='1' -- data 없음. 
    // 계획관리 --> 2:SCM 사용유무(사용 N , 미사용 Y ), 3:업체이원화적용(1:우선업체기준,2:발주비율)... 등등. 1값 없음. 

    if (v_sysM1_1 == "1")
        this.ds_Head.setColumn(0, "ARG_PLNGBN", "1");
    else
        this.ds_Head.setColumn(0, "ARG_PLNGBN", "2");
    // ARG_PLNGBN - 2 고정. 

    //---------------------------------------------------------------------------------------
    //// 부서에 따른 저장 여부 체크(개발부일 경우 개발품만 건드릴수 있고, 생산부일 경우는 다 가능). 20080320
    //// 참조코드 "9J" 등록 된 개발품 등록 부서.
    //---------------------------------------------------------------------------------------

    vs_sql = " SELECT nvl(count(*), 0) AS  CNT FROM REFFPF "
        + " WHERE RFCOD = '9J' "	// 9J 코드 없음. 
        + "   AND RFNA2 = '" + application.gvs_deptid + "'";
    this.gf_SelectSql_sync("ds_Temp : " + vs_sql, "CODE_SELECT", "ff_Callback_sync");

    if (this.ds_Temp.getColumn(0, "CNT") > 0)
        this.ds_Head.setColumn(0, "ARG_GBGUB", "2");   // 개발구분 수정 불가능 
    else
        this.ds_Head.setColumn(0, "ARG_GBGUB", "1");   // 개발구분 수정 가능 
    // ARG_GBGUB - 1 고정. 


    // 18.04.18 KSM
    this.ds_Head.setColumn(0, 'ARG_ITNBR2', '');
    this.ds_Head.setColumn(0, 'ARG_PDM', '%');

    this.Div_Head.edt_itnbr.setFocus();

    var a = application.getPrivateProfile("GV_PGRM_ARG");
    if (!NXCore.isEmpty(a)) {
        application.setPrivateProfile("GV_PGRM_ARG", "");
        this.pvs_arg = a;
        var va_arg = this.pvs_arg.split("|");
        this.pvs_arg1 = va_arg[0];		// itnbr
        this.pvs_arg2 = va_arg[1];		// ittyp >> 

        if (!NXCore.isEmpty(this.pvs_arg1)) {
            this.ds_Head.setColumn(0, 'ARG_ITNBR2', this.pvs_arg1);
        }

        if (!NXCore.isEmpty(this.pvs_arg2)) {
            var vs_ittyp;
            switch (this.pvs_arg2) {
                case "CP":
                    vs_ittyp = '1';		// 완제품
                    break;
                case "SP":
                    vs_ittyp = '2';		// 반제품
                    break;
                case "RM":
                    vs_ittyp = '3';		// 원제품
                    break;
                case "SM":
                case "PM":
                    vs_ittyp = '4';		// 부자재
                    break;
                case "PR":
                    vs_ittyp = '7';		// 상품
                    break;
                case "MR":
                    vs_ittyp = 'Z';		// MRO
                    break;
            }
            if (!NXCore.isEmpty(vs_ittyp)) {

                this.Div_Head.cbo_ittyp.set_value(vs_ittyp);
                this.btn_query_onclick();

            }
        }

    }

    // 황정아P에게만 공급가 노출되도록 수정.20240516.
    // 추후 상품PM팀에게만 노출되도록할지 결정후 수정.
    if (application.gvs_userid != "N2111003" && application.gvs_userid != "ref") {
        this.Tab00.tabpage7.Div_Detail.Static18.set_visible(false);
        this.Tab00.tabpage7.Div_Detail.msk_공급가.set_visible(false);
    } else {
        this.Tab00.tabpage7.Div_Detail.Static18.set_visible(true);
        this.Tab00.tabpage7.Div_Detail.msk_공급가.set_visible(true);
    }

    this.ds_Head.set_enableevent(true);

    this.ff_set_udi();

    this.ds_Temp2.clearData();


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
    this.ff_Tran("SELECT_MASTER");
}

// 추가
this.btn_add_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    // @@@@@@@@@@@@@@

    /*
    if (application.gvs_userid != "ref") {
        alert("PDM 시스템과 인터페이스 준비관계로 잠시 등록 및 수정이 제한됩니다");
        return;
    }	
    */

    if (this.ds_Head.getColumn(0, "ARG_USEYN") != "%") {
        this.gf_message_chk("101406", "전체 선택");  // 사용구분을 선택하십시오. 
        return;
    }

    if (this.ds_List.rowcount < 1) {
        this.gf_message_chk("102926", "품목조회");  // 조회 후 가능합니다. 
        return;
    }
    // @@@@@@@@@@@@@@

    if (this.ds_Head.getColumn(0, "ARG_ITTYP") == "Z") {
        this.gf_message_chk("100131", "");  // MRO품목은 등록 할수 없습니다. 
        return;
    }

    if (fvs_prc_ds == "ds_Pdt_team" && this.ds_List.getColumn(this.ds_List.rowposition, "ITTYP") != "7") {  // 생산팀 자료 add (상품은 생산팀이 없음) 
        this.ff_pdt_team_add();
        return;
    }

    var vs_Ittyp = this.ds_Head.getColumn(0, "ARG_ITTYP");
    if (!this.ff_required_chk("R")) return;
    this.ds_Cust_item.clearData();
    this.ds_Change.clearData();
    this.ds_Pdt_team.clearData();
    this.ds_Seil.clearData();
    this.ds_Temp2.clearData();

    this.ds_List.set_enableevent(false);  // addRow 후 rowfocuschanged 를 처리하지 않기 위함 

    // @@@@@@@@@@@@@@
    if ((this.ds_List.rowcount - 1) == this.ds_List.rowposition) {
        var vn_row = this.ds_List.addRow();
    }
    else {
        var vn_row = this.ds_List.insertRow(this.ds_List.rowposition + 1);
    }

    this.grd_List.selectRow(vn_row, true);
    // @@@@@@@@@@@@@@

    //trace(this.ds_List.saveXML());
    //초기 값 세팅 
    this.ds_List.setColumn(vn_row, "ITTYP", vs_Ittyp);
    this.ds_List.setColumn(vn_row, "USEYN", '0');
    this.ds_List.setColumn(vn_row, "HSNO", '0');
    this.ds_List.setColumn(vn_row, "HOLDYN", 'Y');
    this.ds_List.setColumn(vn_row, "LOTSYN", 'N');
    this.ds_List.setColumn(vn_row, "LOTGUB", 'N');
    this.ds_List.setColumn(vn_row, "PART_GBN", 'Y');
    this.ds_List.setColumn(vn_row, "FILSK", 'Y');
    this.ds_List.setColumn(vn_row, "MLICD", '1');
    this.ds_List.setColumn(vn_row, "LOT", 'Y');
    this.ds_List.setColumn(vn_row, "SAGUB", 'N');
    this.ds_List.setColumn(vn_row, "GBWAN", 'Y');
    this.ds_List.setColumn(vn_row, "KSGBN", 'Y');
    this.ds_List.setColumn(vn_row, "UNMSR", 'KG');
    this.ds_List.setColumn(vn_row, "YONGJAEGBN", '');
    this.ds_List.setColumn(vn_row, "DISP_ITTYP1", vs_Ittyp);
    if (vs_Ittyp == '1' || vs_Ittyp == '2') {
        this.ds_List.setColumn(vn_row, "ITGU", '5');
    }
    else {
        this.ds_List.setColumn(vn_row, "ITGU", '2');
    }

    this.ds_List.setColumn(vn_row, "GBGUB", this.ds_Head.getColumn(0, "ARG_GBGUB"));

    //---------------------------------------------------------------------------------------
    //// 부서에 따른 저장 여부 체크(개발부일 경우 개발품만 건드릴수 있고, 생산부일 경우는 다 가능). 20080320
    //// 참조코드 "9J" 등록 된 개발품 등록 부서.
    //---------------------------------------------------------------------------------------
    if (this.ds_Head.getColumn(0, "ARG_GBGUB") == '2') {
        this.Tab00.tabpage1.Div_Detail.cbo_gbgub.set_cssclass("readonly")  // 개발구분 수정 불가능 
        this.Tab00.tabpage1.Div_Detail.cbo_gbgub.set_readonly(true)  // 개발구분 수정 불가능 
    }
    else {
        this.Tab00.tabpage1.Div_Detail.cbo_gbgub.set_cssclass("input_point")  // 개발구분 수정 가능 
        this.Tab00.tabpage1.Div_Detail.cbo_gbgub.set_readonly(false)  // 개발구분 수정 불가능 
    }

    this.Tab00.tabpage1.Div_Detail.edt_itnbr.set_readonly(false);
    this.Tab00.tabpage1.Div_Detail.edt_itnbr.set_cssclass("input_point");
    this.Tab00.tabpage1.Div_Detail.edt_itnbr.setFocus();  // cursor set
    //this.ff_readonlychk();

    this.ds_List.set_enableevent(true);
}

// 생산팀 추가
this.ff_pdt_team_add = function () {
    /*
    if (application.gvs_userid != "ref") {
        alert("PDM 시스템과 인터페이스 준비관계로 잠시 등록 및 수정이 제한됩니다");
        return;
    }	
    */

    var vn_row;

    if (this.ds_List.rowposition < 0) return;

    if (NXCore.isEmpty(this.ds_List.getColumn(this.ds_List.rowposition, "ITNBR")) || this.ds_List.getColumn(this.ds_List.rowposition, "ITNBR") == "") {
        this.gf_message_chk("200", this.gf_get_trans_word("형번"));
        this.Tab00.tabpage1.Div_Detail.edt_itnbr.setFocus();
        return;
    }

    var vn_row = this.ds_Pdt_team.addRow();
    //trace(this.ds_List.saveXML());
    //초기 값 세팅 
    this.ds_Pdt_team.setColumn(vn_row, "ITNBR", this.ds_List.getColumn(this.ds_List.rowposition, "ITNBR"));
    this.ds_Pdt_team.setColumn(vn_row, "PDRATE", 0);

    this.gf_cursor_setting(this.Tab00.tabpage1.grd_Pdt_team, vn_row, "WKCTR");
}

// 삭제
this.btn_delete_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    /*
    if (application.gvs_userid != "ref") {
        alert("PDM 시스템과 인터페이스 준비관계로 잠시 등록 및 수정이 제한됩니다");
        return;
    }	
    */

    if (this.ds_Head.getColumn(0, "ARG_ITTYP") == "Z") {
        this.gf_message_chk("100131", "");  // MRO품목은 등록 할수 없습니다. 
        return;
    }

    if (this.ds_List.rowposition < 0) return;

    if (this.ds_Head.getColumn(0, "ARG_GBGUB") == "2") {
        this.gf_message_chk("100247", "");  // 개발부서는 개발품만 삭제 가능합니다.
        return;
    }

    if (fvs_prc_ds == "ds_Pdt_team") {  // 생산팀 자료 delete 
        this.ff_pdt_team_delete();
        return;
    }

    var vs_sql = " SELECT FUN_GET_ITEMCHK('" + this.ds_List.getColumn(this.ds_List.rowposition, "ITNBR") + "') AS  RTN FROM DUAL  ";
    this.gf_SelectSql_sync("ds_Temp : " + vs_sql, "TEMP_SELECT", "ff_Callback_sync");
    if (this.ds_Temp.getColumn(0, "RTN") != 0) return;

    if (this.gf_message_chk("1115", "") != 1) return; 	// Msg : 선택하신 자료를 삭제 하시겠습니까?

    //ds_List에서 ITEMAS, ITEMAS_TCPRC, ITEMAS_MRP에서 모두 처리 함.
    //거래처 품번정보 삭제처리 
    if (this.ds_Cust_item.rowcount > 0) {
        var vi_cnt = this.ds_Cust_item.rowcount;
        for (var i = 0; i < vi_cnt; i++) {
            this.ds_Cust_item.deleteRow(i);
        }
    }

    //생산팀 삭제처리 
    if (this.ds_Pdt_team.rowcount > 0) {
        var vi_cnt = this.ds_Pdt_team.rowcount;
        for (var i = 0; i < vi_cnt; i++) {
            this.ds_Pdt_team.deleteRow(i);
        }
    }

    this.ds_List.set_enableevent(false);
    this.ds_List.deleteRow(this.ds_List.rowposition);
    this.ds_List.set_enableevent(true);
}

// 생산팀 삭제
this.ff_pdt_team_delete = function (obj: Button, e: nexacro.ClickEventInfo) {
    /*
    if (application.gvs_userid != "ref") {
        alert("PDM 시스템과 인터페이스 준비관계로 잠시 등록 및 수정이 제한됩니다");
        return;
    }	
    */

    if (this.ds_Pdt_team.rowcount < 1) return;

    this.ds_Pdt_team.deleteRow(this.ds_Pdt_team.rowposition);
}

// 저장
this.btn_save_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    /*
    if (application.gvs_userid != "ref") {
        alert("PDM 시스템과 인터페이스 준비관계로 잠시 등록 및 수정이 제한됩니다");
        return;
    }	
    */

    if (this.ds_Head.getColumn(0, "ARG_ITTYP") == "Z") {
        this.gf_message_chk("100131", "");  // MRO품목은 등록 할수 없습니다. 
        return;
    }

    if (!NXCore.isModified(this.ds_List) && !NXCore.isModified(this.ds_Pdt_team) && !NXCore.isModified(this.ds_Seil)) {
        if (this.Tab00.tabindex != 0 || NXCore.isModified(this.ds_Pdt_team)) {
            this.gf_message_chk("291", "");  // 변경된 자료가 없습니다.
            return;
        }
    }

    //저장시 필수 입력 체크 및 값 입력 
    if (!this.ff_required_chk(pvs_mode)) return;   // 에러 발생시 리턴

    if (this.Tab00.tabindex == 0 && NXCore.isModified(this.ds_Pdt_team)) {
        if (!this.ff_required_chk("pdt_team")) return;   // 에러 발생시 리턴
    }

    if (this.gf_message_chk("1120", "") != 1) return; 	// Msg : 저장 하시겠습니까?

    this.ff_Tran("SAVE_MASTER");
}

// 첨부파일
this.btn_file_upload_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {

    /*
    if (application.gvs_userid != "ref") {
        alert("PDM 시스템과 인터페이스 준비관계로 잠시 등록 및 수정이 제한됩니다");
        return;
    }	
    */

    if (this.ds_Head.getColumn(0, "ARG_ITTYP") == "Z") {
        this.gf_message_chk("100131", "");  // MRO품목은 등록 할수 없습니다. 
        return;
    }

    var resultForm = this.gf_showPopup('file_upload', "co_syst::co_syst_fileupload_download_popup.xfdl", { width: 592, height: 217 },
        {
            A: 'bi/item',         // 폴더 
            B: this.ds_List.getColumn(this.ds_List.rowposition, 'ENGNO'),    // file_path 내용 
            C: 'Y'                // multi select 여부(Y:multi 선택, N:1건선택)
        }, { callback: "ff_AfterPopup_upload" });
}

//20240318, 상품일 경우 여러 형번의 정보를 한꺼번에 봐꿈
this.btn_excl_upload_popup_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vs_openRetv = 'N';
    var vs_args = '';

    vs_args = " ◎ 항목설명" + "\n"
        + "	A.형번, B.품목구분, C.품목분류(분류코드등록), D.모델명, E.품명, F.사이즈, G.관리단위 " + "\n"
        + "     	# 엑셀파일: 헤더 1행, 데이터 2행 부터.. " + "\n"
        + "     	# 클립보드: 엑셀자료를 마우스 드래그로 선택 후 클립보드 복사(Ctrl C) 처리!  <옵션> 헤더포함 유무 " + "\n"
        + " ◎ 주의사항" + "\n"
        + "	1. 엑셀 양식을 임의로 변경불가(항목 삭제/추가 불가)";

    var resultForm = this.gf_showPopup("popup_excel_upload", "co_popu::co_popu_excelupload_ex2.xfdl", { width: 10, height: 20 },
        {
            OpenRetv: vs_openRetv,	// popup 즉시 파일찾기
            Argument: vs_args  		// 조회조건 파라메터 
        }, { callback: "ff_AfterPopup" });


}

this.btn_seil_excel_down_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    this.ff_Tran("SELECT_SEIL_EXCEL");
    //this.gf_excel_download(this.Tab00.tabpage7.Div_Detail.grd_Seil_Excel,"세일전체매칭품목_"+this.gf_today(),"A");
}

//복사
this.btn_copy_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    /*
    if (application.gvs_userid != "ref") {
        alert("PDM 시스템과 인터페이스 준비관계로 잠시 등록 및 수정이 제한됩니다");
        return;
    }
    */

    // @@@@@@@@@@@@@@
    if (this.ds_Head.getColumn(0, "ARG_USEYN") != "%") {
        this.gf_message_chk("101406", "전체 선택");  // 사용구분을 선택하십시오. 
        return;
    }

    if (this.ds_List.rowcount < 1) {
        this.gf_message_chk("102926", "품목조회");  // 조회 후 가능합니다. 
        return;
    }
    // @@@@@@@@@@@@@@

    if (this.ds_Head.getColumn(0, "ARG_ITTYP") == "Z") {
        this.gf_message_chk("100131", "");  // MRO품목은 등록 할수 없습니다. 
        return;
    }

    if (this.ds_List.rowcount <= 0) {
        return -1;
    }
    if (this.gf_message_chk("1150", "") < 0) return;

    this.ds_Cust_item.clearData();
    this.ds_Change.clearData();
    this.ds_Pdt_team.clearData();

    this.ds_List.set_enableevent(false);

    var vn_source_row = this.ds_List.rowposition;
    if (vn_source_row + 1 == this.ds_List.rowcount)
        var vn_to_row = this.ds_List.addRow();
    else
        var vn_to_row = this.ds_List.insertRow(vn_source_row + 1);

    this.grd_List.selectRow(vn_to_row, true);
    //행복사
    this.ds_List.copyRow(vn_to_row, this.ds_List, vn_source_row);

    var vs_new_itnbr = this.ff_itnbr_make(this.ds_List.getColumn(vn_to_row, "ITNBR").substr(0, 13));

    this.ds_List.setColumn(vn_to_row, "ITNBR", vs_new_itnbr);
    this.ds_List.setColumn(vn_to_row, "TYPECD", vs_new_itnbr);
    this.ds_List.setColumn(vn_to_row, "M_ITNBR", vs_new_itnbr);

    //this.ds_List.setColumn(vn_to_row, "ITNBR", "");
    //this.ds_List.setColumn(vn_to_row, "M_ITNBR", "");
    //this.ds_List.setColumn(vn_to_row, "TYPECD", "");

    this.ds_List.setColumn(vn_to_row, "UPD_DATE", "");
    this.ds_List.setColumn(vn_to_row, "UPD_TIME", "");
    this.ds_List.setColumn(vn_to_row, "UPD_USER", "");

    // 	var vs_Saupj = this.ds_Head.getColumn(0, 'ARG_SAUPJ');
    // 	if( vs_Saupj < 'C10'){
    // 		this.ds_List.setColumn(vn_to_row, "SAUPJ1", "10");
    // 		this.ds_List.setColumn(vn_to_row, "SAUPJ2", "20");
    // 		this.ds_List.setColumn(vn_to_row, "SAUPJ3", "30");
    // 	}

    ///// 품번허가 번호 CLEAR... 2012.12.05 하태균 팀장 요청 사항
    ///// 복사의 경우 CLEAR
    this.ds_List.setColumn(this.ds_List.rowposition, "LCS_NO", null);
    this.ds_List.setColumn(this.ds_List.rowposition, "ITEM_LCS_NO", null);


    // 이전형번 NULL 2018.05.11
    this.ds_List.setColumn(this.ds_List.rowposition, "HARD_GC", null);

    // TYPECD    NULL 2018.05.14
    this.ds_List.setColumn(this.ds_List.rowposition, "TYPECD", null);
    this.ds_List.setColumn(this.ds_List.rowposition, "M_ITNBR", null);

    this.ds_List.set_enableevent(true);

    this.Tab00.tabpage1.Div_Detail.edt_itnbr.set_readonly(false);
    this.Tab00.tabpage1.Div_Detail.edt_itnbr.set_cssclass("input_point");
    this.Tab00.tabpage1.Div_Detail.edt_itnbr.setFocus();
}

/*엑셀변환버튼*/
this.btn_excel_chg_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    this.gf_excel_download(this.grd_List);
}

//취소 
this.btn_cancel_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    this.ff_SetCondition();
}

// 닫기
this.btn_close_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    this.gf_closeMenu();
}

// 화면을 닫기전에 수정사항이 있으면 저장할것인지 묻는다.
this.form_onbeforeclose = function (obj: Form, e: CloseEventInfo) {
    var vb_true = true;

    if (NXCore.isModified(this.ds_List) || NXCore.isModified(this.ds_Cust_item)) {
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

this.btn_sub_add_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    /*
    if (application.gvs_userid != "ref") {
        alert("PDM 시스템과 인터페이스 준비관계로 잠시 등록 및 수정이 제한됩니다");
        return;
    }	
    */

    if (this.ds_Head.getColumn(0, "ARG_ITTYP") == "Z") {
        this.gf_message_chk("100131", "");  // MRO품목은 등록 할수 없습니다. 
        return;
    }

    var vs_Itnbr;
    var vn_Seq;

    vs_Itnbr = this.ds_Head.getColumn(0, "ARG_ITNBR");

    var vn_row = this.ds_Cust_item.addRow();
    var vi_Max = this.ds_Cust_item.getMax("SEQNO")

    if (NXCore.isEmpty(vi_Max)) {
        vi_Max = 1;
    }
    else {
        vi_Max = vi_Max + 1;
    }
    this.ds_Cust_item.setColumn(vn_row, "ITNBR", vs_Itnbr);
    this.ds_Cust_item.setColumn(vn_row, "SEQNO", vi_Max);
    this.ds_Cust_item.setColumn(vn_row, "USEYN", '1');
}

this.btn_sub_delete_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    /*
    if (application.gvs_userid != "ref") {
        alert("PDM 시스템과 인터페이스 준비관계로 잠시 등록 및 수정이 제한됩니다");
        return;
    }	
    */

    if (this.ds_Head.getColumn(0, "ARG_ITTYP") == "Z") {
        this.gf_message_chk("100131", "");  // MRO품목은 등록 할수 없습니다. 
        return;
    }

    this.ds_Cust_item.deleteRow(this.ds_Cust_item.rowposition);
}

this.btn_sub_save_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    /*
    if (application.gvs_userid != "ref") {
        alert("PDM 시스템과 인터페이스 준비관계로 잠시 등록 및 수정이 제한됩니다");
        return;
    }	
    */

    if (this.ds_Head.getColumn(0, "ARG_ITTYP") == "Z") {
        this.gf_message_chk("100131", "");  // MRO품목은 등록 할수 없습니다. 
        return;
    }

    if (!NXCore.isModified(this.ds_Cust_item)) {
        this.gf_message_chk("291", "");  // 변경된 자료가 없습니다.
        return;
    }

    if (!this.ff_required_chk("C")) return;

    this.ff_Tran("SAVE_ITMBUY");
}


this.btn_sub_cancel_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    this.ff_Tran("SELECT_ITMBUY");
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
    var vs_data;			//이벤트에서 데이터 값  
    var vs_sql, vs_ittyp; 			//Sql의 값
    var vn_row; 			// 해당 row 값  

    // dataset과 다른 object로 나눠서 처리 
    // obj를 dataset를 확인 해서 처리 함.	
    if (obj == '[object Dataset]') {
        vn_row = e.row;
        vs_data = e.newvalue;
        // dataset 이름 별로 처리 
        if (obj.id == 'ds_Head') {
        }
        else if (obj.id == 'ds_List') {
            return;
        }
        else if (obj.id == 'ds_Cust_item') {
            if (this.ds_Head.getColumn(0, "ARG_ITTYP") == "Z") {
                this.gf_message_chk("100131", "");  // MRO품목은 등록 할수 없습니다. 
                return;
            }

            switch (e.columnid) {
                case 'CVCOD':
                    if (NXCore.isEmpty(vs_data) || vs_data == '') {
                        this.ds_Cust_item.setColumn(vn_row, "CVNAS", "");
                        return;
                    }

                    vs_sql = "SELECT CVNAS2 AS CVNAS FROM VNDMST "
                    vs_sql += "  WHERE CVCOD = '" + vs_data + "'";

                    this.gf_SelectSql_sync("ds_Temp : " + vs_sql, "CVCOD_SELECT", "ff_Callback_sync");

                    if (vi_ErrorCode < 0) return;

                    if (this.ds_Temp.rowcount == 0) {
                        //this.Div_Detail.ds_List.setFocus();  // cursor set
                        this.ds_Cust_item.setColumn(vn_row, "CVCOD", "");
                        this.ds_Cust_item.setColumn(vn_row, "CVNAS", "");
                        //this.ds_Cust_item.setFocus(); 
                    }
                    else {
                        this.ds_Cust_item.setColumn(vn_row, "CVNAS", this.ds_Temp.getColumn(0, "CVNAS"));
                    }
                    break;
            }
        }
        else if (obj.id == 'ds_Pdt_team') {
            if (this.ds_Head.getColumn(0, "ARG_ITTYP") == "Z") {
                this.gf_message_chk("100131", "");  // MRO품목은 등록 할수 없습니다. 
                return;
            }
            switch (e.columnid) {
                case 'WKCTR':
                    if (NXCore.isEmpty(vs_data) || vs_data == "") {
                        this.ds_Pdt_team.setColumn(vn_row, "PDTGU", "");
                        this.ds_Pdt_team.setColumn(vn_row, "JOCOD", "");
                        this.ds_Pdt_team.setColumn(vn_row, "PDTGU", "");
                        this.ds_Pdt_team.setColumn(vn_row, "PDTGU_NM", "");
                        this.ds_Pdt_team.setColumn(vn_row, "JOCODE_NM", "");
                        this.ds_Pdt_team.setColumn(vn_row, "WKCTR_NM", "");
                        return;
                    }

                    vs_ittyp = this.ds_List.getColumn(this.ds_List.rowposition, "ITTYP");
                    if (vs_ittyp != "7") {
                        vs_sql = " SELECT WCDSC, JOCOD, PDTGU FROM WRKCTR  WHERE WKCTR = '" + vs_data + "' ";
                        this.gf_SelectSql_sync("ds_Temp : " + vs_sql, "TEMP_SELECT", "ff_Callback_sync");

                        if (this.ds_Temp.rowcount < 1) {
                            this.gf_cursor_setting(this.Tab00.tabpage1.grd_Pdt_team, vn_row, "WKCTR");
                            this.gf_message_chk("190", "작업장");  // 코드 오류 
                            this.ds_Pdt_team.setColumn(vn_row, "WKCTR", "");
                            this.ds_Pdt_team.setColumn(vn_row, "WKCTR_NM", "");
                            return;
                        }

                        this.ds_Pdt_team.setColumn(vn_row, "WKCTR_NM", this.ds_Temp.getColumn(0, "WCDSC"));
                        this.ds_Pdt_team.setColumn(vn_row, "JOCOD", this.ds_Temp.getColumn(0, "JOCOD"));
                        this.ds_Pdt_team.setColumn(vn_row, "PDTGU", this.ds_Temp.getColumn(0, "PDTGU"));
                    }

                    break;
            }
        }
    }
    else {
        //Object 별 처리 
        // 상위 Div 이름을 가져와서 각각처리 함.
        vs_data = e.postvalue;

        if (obj.parent.name == 'Div_Head') {
            this.ds_List.clearData();
            switch (obj.name) {
                case 'cbo_ittyp':
                    this.ds_Head.setColumn(0, 'ARG_ITNBR2', '');
                    this.ds_Head.setColumn(0, 'ARG_PDM', '%');

                    this.ff_excel_upload_btn_set();

                    break;

            }
        }
        else if (obj.parent.name == 'Div_Detail') {
            if (this.ds_Head.getColumn(0, "ARG_ITTYP") == "Z") {
                this.gf_message_chk("100131", "");  // MRO품목은 등록 할수 없습니다. 
                return;
            }
            vn_row = this.ds_List.rowposition;
            switch (obj.name) {
                case 'edt_itcls':
                    if (NXCore.isEmpty(vs_data) || vs_data == '') {
                        this.ds_List.setColumn(vn_row, "TITNM", "");
                        return;
                    }

                    var vs_Ittyp = this.ds_List.getColumn(vn_row, "ITTYP");

                    vs_sql = "SELECT TITNM FROM ITNCT "
                    vs_sql += "  WHERE ITTYP = '" + vs_Ittyp + "' AND ITCLS = '" + vs_data + "'";

                    this.gf_SelectSql_sync("ds_Temp : " + vs_sql, "ITNCT_SELECT", "ff_Callback_sync");

                    if (vi_ErrorCode < 0) return;

                    if (this.ds_Temp.rowcount == 0) {
                        //this.Div_Detail.ds_List.setFocus();  // cursor set
                        this.ds_List.setColumn(vn_row, "ITCLS", "");
                        this.ds_List.setColumn(vn_row, "TITNM", "");
                    }
                    else {
                        this.ds_List.setColumn(vn_row, "TITNM", this.ds_Temp.getColumn(0, "TITNM"));
                    }
                    break;
                case 'edt_typecd':
                    if (NXCore.isEmpty(vs_data) || vs_data == '') {
                        this.ds_List.setColumn(vn_row, "TYPENM", "");
                        return;
                    }

                    vs_sql = "SELECT TYPENM FROM ROUTNG_TYPE "
                    vs_sql += "  WHERE TYPECD = '" + vs_data + "'";

                    this.gf_SelectSql_sync("ds_Temp : " + vs_sql, "TEMP_SELECT", "ff_Callback_sync");

                    if (vi_ErrorCode < 0) return;

                    if (this.ds_Temp.rowcount == 0) {
                        //this.Div_Detail.ds_List.setFocus();  // cursor set
                        this.ds_List.setColumn(vn_row, "TYPECD", "");
                        this.ds_List.setColumn(vn_row, "TYPENM", "");
                    }
                    else {
                        this.ds_List.setColumn(vn_row, "TYPENM", this.ds_Temp.getColumn(0, "TYPENM"));
                    }
                    break;
                case 'edt_tcprc_sacvcod':
                    if (NXCore.isEmpty(vs_data) || vs_data == '') {
                        this.ds_List.setColumn(vn_row, "CVNAS", "");
                        return;
                    }

                    vs_sql = "SELECT CVNAS2 AS CVNAS FROM VNDMST "
                    vs_sql += "  WHERE CVCOD = '" + vs_data + "'";

                    this.gf_SelectSql_sync("ds_Temp : " + vs_sql, "TEMP_SELECT", "ff_Callback_sync");

                    if (vi_ErrorCode < 0) return;

                    if (this.ds_Temp.rowcount == 0) {
                        //this.Div_Detail.ds_List.setFocus();  // cursor set
                        this.ds_List.setColumn(vn_row, "SACVCOD", "");
                        this.ds_List.setColumn(vn_row, "CVNAS", "");
                    }
                    else {
                        this.ds_List.setColumn(vn_row, "CVNAS", this.ds_Temp.getColumn(0, "CVNAS"));
                    }
                    break;
                case 'rad_Itgu':
                    var vs_Ittyp = this.ds_List.getColumn(vn_row, "ITTYP");
                    if (vs_Ittyp == '1' || vs_Ittyp == '2') {
                        if (vs_data < '5') {
                            this.gf_message_chk("121356", "구입형태");
                            this.ds_List.setColumn(vn_row, "ITGU", '5');
                            return;
                        }
                    }
                    else {
                        if (vs_data >= '5') {
                            this.gf_message_chk("121356", "구입형태");
                            this.ds_List.setColumn(vn_row, "ITGU", '2');
                            return;
                        }
                    }
                    break;
                case 'edt_itnbr':
                    if (NXCore.isEmpty(vs_data) || vs_data == '') {
                        return;
                    }

                    // @@@@@@@@@@@@@@@@@

                    this.ds_List.set_enableevent(false);

                    if (vs_data.length == 13) {
                        var vs_new_itnbr = this.ff_itnbr_make(vs_data);

                        this.ds_List.setColumn(vn_row, "ITNBR", vs_new_itnbr);
                        this.ds_List.setColumn(vn_row, "TYPECD", vs_new_itnbr);
                        this.ds_List.setColumn(vn_row, "M_ITNBR", vs_new_itnbr);
                    }
                    else if (vs_data.length == 18) {
                        this.ds_List.setColumn(vn_row, "TYPECD", vs_data);
                        this.ds_List.setColumn(vn_row, "M_ITNBR", vs_data);
                    }
                    else {
                        this.gf_message_chk("820", this.gf_get_trans_word("형번 18자리, 13자리(자동생성)"));  // 자릿 수가 틀립니다.
                        this.gf_cursor_setting(this.grd_List, vn_row, "ITNBR");
                        this.Tab00.tabpage1.Div_Detail.edt_itnbr.setFocus();  // cursor set
                        this.Tab00.tabpage1.Div_Detail.edt_itnbr.set_readonly(false);
                        this.Tab00.tabpage1.Div_Detail.edt_itnbr.set_cssclass("input_point");
                        this.ds_List.setColumn(vn_row, "ITNBR", "");
                        this.ds_List.set_enableevent(true);
                        return;
                    }

                    this.ds_List.set_enableevent(true);

                    // @@@@@@@@@@@@@@@@@

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
            vs_itnbr = this.ds_List.getColumn(e.row, 'ITNBR');
            if (this.ds_List.getRowType(e.row) != '2') {
                this.Tab00.tabpage1.Div_Detail.edt_itnbr.set_readonly(true);
                this.Tab00.tabpage1.Div_Detail.edt_itnbr.set_cssclass("readonly");
            }
            else {
                this.Tab00.tabpage1.Div_Detail.edt_itnbr.set_readonly(false);
                this.Tab00.tabpage1.Div_Detail.edt_itnbr.set_cssclass("input_point");
            }
            // 			if( NXCore.isEmpty(this.ds_List.getColumn(e.row, 'ENGNO'))){
            // 				this.Tab00.tabpage1.Div_Detail.img_Filekey.set_visible(false);
            // 			}
            // 			else{
            // 				this.Tab00.tabpage1.Div_Detail.img_Filekey.set_visible(true);
            // 			}
            this.ds_Head.set_enableevent(false);
            this.ds_Head.setColumn(0, 'ARG_ITNBR', vs_itnbr);
            this.ds_Head.set_enableevent(true);
            //this.ff_Tran("SELECT_ITMBUY");
            return;
        }
        //else if (obj.id == 'grd_List'){
        //	return;
        //}

    }
    else {
        if (obj.parent.name == 'Div_Head') {
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
    var vs_data = e.postvalue;
    var vs_Arg = '';

    if (obj.readonly) return;		//readonly 상태 이면 팝업 취소 

    // Grid과 다른 object로 나눠서 처리 
    // obj가 Grid를 확인해서 처리함	
    if (obj == '[object Grid]') {
        if (obj.id == 'grd_List') {
            return;
        }
        else if (obj.id == 'grd_Pdt_team') {
            if (this.ds_Head.getColumn(0, "ARG_ITTYP") == "Z") {
                this.gf_message_chk("100131", "");  // MRO품목은 등록 할수 없습니다. 
                return;
            }

            switch (this.gf_GetCellBind(obj, e.cell, 'Body')) {
                case 'WKCTR':
                    if (!NXCore.isEmpty(this.ds_Pdt_team.getColumn(this.ds_Pdt_team.rowposition, "OLD_ITNBR"))) return;

                    var resultForm = this.gf_showPopup("popup_grd_wkctr", "co_popu::co_popu_workplace_f.xfdl", { width: 10, height: 20 },
                        {
                            OpenRetv: 'Y',   // popup open 즉시 조회  
                            MultSelect: 'N',   // MULTI LINE 선택
                            Argument: this.ds_Head.getColumn(0, "ARG_SAUPJ")  // 조회조건 파라메터 
                        }, { callback: "ff_AfterPopup" });

                    break;
            }
        }
        else if ('grd_List_itmbuy') {
            if (this.ds_Head.getColumn(0, "ARG_ITTYP") == "Z") {
                this.gf_message_chk("100131", "");  // MRO품목은 등록 할수 없습니다. 
                return;
            }

            switch (this.gf_GetCellBind(obj, e.cell, 'Body')) {
                case 'CVCOD':
                    var resultForm = this.gf_showPopup("popup_grd_cvcod", "co_popu::co_popu_vndmst_f.xfdl", { width: 10, height: 20 },
                        {
                            OpenRetv: 'Y',   // popup open 즉시 조회  
                            MultSelect: 'N',   // MULTI LINE 선택
                            Argument: vs_Arg  // 조회조건 파라메터 
                        }, { callback: "ff_AfterPopup" });

                    break;
            }
        }
    }
    else {
        if (obj.parent.name == 'Div_Head') {
            return;
        }
        else if (obj.parent.name == 'Div_Detail') {
            if (this.ds_Head.getColumn(0, "ARG_ITTYP") == "Z") {
                this.gf_message_chk("100131", "");  // MRO품목은 등록 할수 없습니다. 
                return;
            }

            switch (obj.name) {
                case 'edt_itcls':
                    vn_row = this.ds_List.rowposition;
                    var vs_Ittyp = this.ds_List.getColumn(vn_row, "ITTYP");
                    vs_Arg = vs_Ittyp;
                    var resultForm = this.gf_showPopup("popup_object_itcls", "co_popu::co_popu_itcls_f.xfdl", { width: 10, height: 20 },
                        {
                            OpenRetv: 'Y',   // popup open 즉시 조회  
                            MultSelect: 'N',   // MULTI LINE 선택
                            Argument: vs_Arg  // 조회조건 파라메터 
                        }, { callback: "ff_AfterPopup" });

                    break;
                case 'edt_typecd':
                    vs_Arg = this.ds_Head.getColumn(0, "ARG_SAUPJ");
                    var resultForm = this.gf_showPopup("popup_object_typecd", "co_popu::co_popu_routngtyp_f.xfdl", { width: 10, height: 20 },
                        {
                            OpenRetv: 'Y',   // popup open 즉시 조회  
                            MultSelect: 'N',   // MULTI LINE 선택
                            Argument: vs_Arg  // 조회조건 파라메터 
                        }, { callback: "ff_AfterPopup" });

                    break;
                case 'edt_tcprc_sacvcod':
                    var resultForm = this.gf_showPopup("popup_object_cvcod", "co_popu::co_popu_vndmst_f.xfdl", { width: 10, height: 20 },
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
    var va_data = this.gf_popup_data(obj);  // popup 에서 넘어온 data 를 array 로 받아온다.

    if (va_data == false) return;  // 자료 없음 

    switch (strId) {

        // ff_Object_onrbuttondown 에서 this.gf_showPopup("id","","")  <-- 로 분류 하여 후처리 

        case "popup_grd_cvcod":
            for (var i = 0; i < va_data.length; i++) {
                this.ds_Cust_item.setColumn(this.ds_Cust_item.rowposition, 'CVCOD', va_data[i][0]);
                this.ds_Cust_item.setColumn(this.ds_Cust_item.rowposition, 'CVNAS', va_data[i][2]);
            }
            break;
        case "popup_grd_wkctr":
            for (var i = 0; i < va_data.length; i++) {
                this.ds_Pdt_team.setColumn(this.ds_Pdt_team.rowposition, 'WKCTR', va_data[i][0]);
                this.ds_Pdt_team.setColumn(this.ds_Pdt_team.rowposition, 'WKCTR_NM', va_data[i][1]);
                this.ds_Pdt_team.setColumn(this.ds_Pdt_team.rowposition, 'JOCOD', va_data[i][2]);
                this.ds_Pdt_team.setColumn(this.ds_Pdt_team.rowposition, 'JOCODE_NM', va_data[i][3]);
                this.ds_Pdt_team.setColumn(this.ds_Pdt_team.rowposition, 'PDTGU', va_data[i][4]);
                this.ds_Pdt_team.setColumn(this.ds_Pdt_team.rowposition, 'PDTGU_NM', va_data[i][5]);
            }
            break;
        case "popup_object_itcls":
            for (var i = 0; i < va_data.length; i++) {
                this.ds_List.setColumn(this.ds_List.rowposition, 'ITCLS', va_data[i][1]);
                this.ds_List.setColumn(this.ds_List.rowposition, 'TITNM', va_data[i][2]);
            }
            break;
        case "popup_object_typecd":
            for (var i = 0; i < va_data.length; i++) {
                this.ds_List.setColumn(this.ds_List.rowposition, 'TYPECD', va_data[i][0]);
                this.ds_List.setColumn(this.ds_List.rowposition, 'TYPENM', va_data[i][1]);
            }
            break;
        case "popup_object_cvcod":
            for (var i = 0; i < va_data.length; i++) {
                this.ds_List.setColumn(this.ds_List.rowposition, 'SACVCOD', va_data[i][0]);
                this.ds_List.setColumn(this.ds_List.rowposition, 'CVNAS', va_data[i][2]);
            }
            break;

        //20240318, 상품일 경우 여러 형번의 정보를 한꺼번에 봐꿈
        //20240329, 모델명 추가
        case "popup_excel_upload":

            var vn_Row, vItnbr, vIttyp, vItcls, vProdnm, vItdsc, vIspec, vUnmsr;
            this.ds_Temp2.clearData();

            //if(!va_Data) return ;   

            this.ds_Temp2.set_enableevent(false);

            for (var i = 0; i < va_data.length; i++) {
                if (!NXCore.isEmpty(va_data[i][0])) {
                    // 	A.형번, B.품목구분, C.품목분류(분류코드등록), D.모델명, E.품명, F.사이즈, G.관리단위
                    vItnbr = va_data[i][0].trim(" ");
                    vIttyp = va_data[i][1].trim(" ");
                    vItcls = va_data[i][2].trim(" ");
                    vProdnm = va_data[i][3].trim(" ");
                    vItdsc = va_data[i][4].trim(" ");
                    vIspec = va_data[i][5].trim(" ");
                    vUnmsr = va_data[i][6].trim(" ");
                    vUnmsr = vUnmsr.toUpperCase();

                    vn_Row = this.ds_Temp2.addRow();
                    //vn_Row = this.ds_Temp2.insertRow();
                    this.ds_Temp2.set_rowposition(vn_Row);

                    this.ds_Temp2.addColumn("ITNBR", "string");		//형번
                    this.ds_Temp2.addColumn("ITTYP", "string");		//품목구분
                    this.ds_Temp2.addColumn("ITCLS", "string");		//품목분류
                    this.ds_Temp2.addColumn("PRODNM", "string");		//모델명
                    this.ds_Temp2.addColumn("ITDSC", "string");		//품명
                    this.ds_Temp2.addColumn("ISPEC", "string");		//사이즈
                    this.ds_Temp2.addColumn("UNMSR", "string");		//관리단위

                    //형번 
                    var vSql = " SELECT COUNT(*) ITM_CNT FROM ITEMAS WHERE ITNBR = '" + vItnbr + "' ";
                    this.ds_Temp.clearData();
                    this.gf_SelectSql_sync("ds_Temp: " + vSql, "CVCOD_SELECT", "ff_Callback_sync");
                    if (this.ds_Temp.getColumn(0, "ITM_CNT") > 0) {
                        this.ds_Temp2.setColumn(vn_Row, 'ITNBR', vItnbr);
                    } else {
                        alert(vItnbr + " 형번은 없습니다. ");
                        return;
                    }

                    //품목구분
                    if (NXCore.isEmpty(vIttyp)) {
                        alert("품목구분은 필수값입니다. ");
                        return;
                    } else {
                        var vSql = " SELECT RFGUB 		 "
                            + "   FROM REFFPF  	 "
                            + "  WHERE RFCOD = '05' "
                            + "    AND RFNA1 = '" + vIttyp + "' ";
                        this.ds_Temp.clearData();
                        this.gf_SelectSql_sync("ds_Temp: " + vSql, "CVCOD_SELECT", "ff_Callback_sync");

                        if (this.ds_Temp.rowcount <= 0) {
                            alert((i + 1) + "번째 품목구분을 확인 하세요. ");
                            return;
                        } else {
                            this.ds_Temp2.setColumn(vn_Row, 'ITTYP', this.ds_Temp.getColumn(0, "RFGUB"));
                        }
                    }

                    //품목분류 
                    if (NXCore.isEmpty(vItcls)) {
                        alert("품목분류는 필수값입니다. ");
                        return;
                    } else {
                        var vSql = " SELECT ITCLS 	 "
                            + "   FROM ITNCT  	 "
                            + "  WHERE ITCLS = '" + vItcls + "' "
                            + "    AND ITTYP = (SELECT RFGUB  "
                            + "                   FROM REFFPF "
                            + "                  WHERE RFCOD = '05' "
                            + "                    AND RFNA1 = '" + vIttyp + "') ";
                        this.ds_Temp.clearData();
                        this.gf_SelectSql_sync("ds_Temp: " + vSql, "CVCOD_SELECT", "ff_Callback_sync");

                        if (this.ds_Temp.rowcount <= 0) {
                            alert((i + 1) + "번째 품목분류을 확인 하세요. ");
                            return;
                        } else {
                            this.ds_Temp2.setColumn(vn_Row, 'ITCLS', vItcls);
                        }
                    }

                    //모델명
                    if (NXCore.isEmpty(vProdnm)) {
                        alert((i + 1) + "번째 모델명은 필수값입니다. ");
                        return;
                    } else {
                        this.ds_Temp2.setColumn(vn_Row, 'PRODNM', vProdnm);
                    }

                    //품명
                    if (NXCore.isEmpty(vItdsc)) {
                        alert((i + 1) + "번째 품명은 필수값입니다. ");
                        return;
                    } else {
                        this.ds_Temp2.setColumn(vn_Row, 'ITDSC', vItdsc);
                    }

                    //사이즈
                    if (NXCore.isEmpty(vIspec)) {
                        alert((i + 1) + "번째 사이즈는 필수값입니다. ");
                        return;
                    } else {
                        this.ds_Temp2.setColumn(vn_Row, 'ISPEC', vIspec);
                    }

                    //관리 단위
                    if (NXCore.isEmpty(vUnmsr)) {
                        alert((i + 1) + "번째 관리 단위는 필수값입니다. ");
                        return;
                    } else {
                        var vSql = " SELECT RFGUB 		 "
                            + "   FROM REFFPF  	 "
                            + "  WHERE RFCOD = '20' "
                            + "    AND RFGUB = '" + vUnmsr + "' ";
                        this.ds_Temp.clearData();
                        this.gf_SelectSql_sync("ds_Temp: " + vSql, "CVCOD_SELECT", "ff_Callback_sync");

                        if (this.ds_Temp.rowcount != 1) {
                            alert((i + 1) + "번째 관리 단위를 확인 하세요. ");
                            return;
                        } else {
                            this.ds_Temp2.setColumn(vn_Row, 'UNMSR', vUnmsr);
                        }
                    }

                    //ITEMAS 엑셀업로드 히스토리저장
                    var vSql2, vSql4;
                    vSql4 = "SELECT MAX(NVL(SEQ_NO, 0))+1 AS SEQ_NO FROM ITEMAS_EXCEL_UP_HIST";
                    this.gf_SelectSql_sync("ds_Temp: " + vSql4, 'CVCOD_SELECT', "ff_Callback_sync", 0);

                    if (NXCore.isEmpty(this.ds_Temp.getColumn(0, "SEQ_NO"))) this.ds_Temp.setColumn(0, "SEQ_NO", 1);

                    if (i != 0) {
                        vSql2 += "@#$ ";
                    }
                    vSql2 = " INSERT INTO ITEMAS_EXCEL_UP_HIST  	 "
                        + "        (SEQ_NO, YYMMDD, ITNBR, ITDSC, ISPEC, ITTYP, ITCLS, UNMSR, CREATE_DATE, CREATE_BY, PRODNM) "
                        + " 		 SELECT '" + this.ds_Temp.getColumn(0, "SEQ_NO") + "' SEQ_NO"
                        + "             , TO_CHAR(SYSDATE, 'YYMMDD') YYMMDD "
                        + "             , ITNBR 	"
                        + "      		  , ITDSC 	"
                        + "      		  , ISPEC 	"
                        + "      		  , ITTYP 	"
                        + "      		  , ITCLS 	"
                        + "      		  , UNMSR 	"
                        + "      		  , SYSDATE "
                        + "      		  , '" + application.gvs_userid + "' "
                        + "      		  , PRODNM  "
                        + "      	   FROM ITEMAS	"
                        + "  		  WHERE ITNBR = '" + this.ds_Temp2.getColumn(i, "ITNBR") + "' ";

                    this.gf_UpdateSql_sync(vSql2, 'UPDATE_SQL', "ff_Callback_sync", 0);

                    //변경된 데이터 ITEMAS에 저장
                    var vSql3;
                    if (i != 0) {
                        vSql3 += "@#$ ";
                    }
                    vSql3 = " UPDATE ITEMAS 	 "
                        + "    SET ITTYP  = '" + this.ds_Temp2.getColumn(i, "ITTYP") + "' "
                        + "      , ITCLS  = '" + this.ds_Temp2.getColumn(i, "ITCLS") + "' "
                        + "      , ITDSC  = '" + this.ds_Temp2.getColumn(i, "ITDSC") + "' "
                        + "      , ISPEC  = '" + this.ds_Temp2.getColumn(i, "ISPEC") + "' "
                        + "      , UNMSR  = '" + this.ds_Temp2.getColumn(i, "UNMSR") + "' "
                        + "      , PRODNM = '" + this.ds_Temp2.getColumn(i, "PRODNM") + "' "
                        + "  WHERE ITNBR  = '" + this.ds_Temp2.getColumn(i, "ITNBR") + "' ";

                    this.gf_UpdateSql_sync(vSql3, 'UPDATE_SQL', "ff_Callback_sync", 0);
                }
            }

            this.ds_Temp2.set_enableevent(true);
            this.ff_Tran("SELECT_MASTER");
            //alert("EXCEL UPLOAD 처리 완료"); 

            break;

            return;
    }
}

/***********************************************************************
 * User created function specification
 ************************************************************************/

// 조건 체크 (필수 입력 항목 체크)
this.ff_required_chk = function (vs_mode) {
    var vs_Gbn;
    var vs_data, vs_Ittyp, vs_Itcls;
    var i, vi_row, vi_len;

    // 공통 체크처리 

    // 등록(I), 수정(M), 조회(R) 에서 필수 값 체크   
    // 가능하면 HEAD, MASTER까지 모두 여기서 체크, 처리 해주세요.

    switch (vs_mode) {
        //조회
        case "R":

            break;
        //입력 
        case "I":
            //변경 된 값만 찾아서 처리함.
            for (i = 0; i < this.ds_List.rowcount; i++) {
                // 추가나 수정된 로우를 찾는다.
                vi_row = this.ds_List.findRowExpr("(this.getRowType(rowidx)==4)||(this.getRowType(rowidx)==2)", i);
                if (vi_row < 0) break;
                i = vi_row;

                vs_data = this.ds_List.getColumn(vi_row, "ITNBR");
                if (NXCore.isEmpty(vs_data)) {
                    this.gf_message_chk("200", this.gf_get_trans_word("형번"));
                    this.gf_cursor_setting(this.grd_List, i, "ITNBR");
                    this.Tab00.tabpage1.Div_Detail.edt_itnbr.setFocus();  // cursor set
                    this.Tab00.tabpage1.Div_Detail.edt_itnbr.set_readonly(false);
                    this.Tab00.tabpage1.Div_Detail.edt_itnbr.set_cssclass("input_point");
                    return false;
                }

                // @@@@@@@@@@@@@@@@@

                if (this.ds_List.getRowType(i) == 2) {
                    if (vs_data.length != 18) {
                        this.gf_message_chk("820", this.gf_get_trans_word("형번 18자리, 13자리(자동생성)"));  // 자릿 수가 틀립니다.
                        this.gf_cursor_setting(this.grd_List, i, "ITNBR");
                        this.Tab00.tabpage1.Div_Detail.edt_itnbr.setFocus();  // cursor set
                        this.Tab00.tabpage1.Div_Detail.edt_itnbr.set_readonly(false);
                        this.Tab00.tabpage1.Div_Detail.edt_itnbr.set_cssclass("input_point");
                        return false;
                    }
                }

                // @@@@@@@@@@@@@@@@@


                vs_Ittyp = this.ds_List.getColumn(vi_row, "ITTYP");
                if (NXCore.isEmpty(vs_Ittyp)) {
                    this.gf_message_chk("200", this.gf_get_trans_word("품목구분"));
                    this.gf_cursor_setting(this.grd_List, i, "ITNBR");
                    this.Tab00.tabpage1.Div_Detail.cbo_ittyp2.setFocus();  // cursor set
                    return false;
                }
                if (vs_Ittyp == "1" || vs_Ittyp == "2") {
                    vs_data = this.ds_List.getColumn(vi_row, "PRODNM");
                    if (NXCore.isEmpty(vs_data)) {
                        this.gf_message_chk("200", this.gf_get_trans_word("모델명"));
                        this.gf_cursor_setting(this.grd_List, i, "PRODNM");
                        this.Tab00.tabpage1.Div_Detail.edt_prodnm.setFocus();  // cursor set
                        return false;
                    }
                }

                vs_data = this.ds_List.getColumn(vi_row, "ITCLS");
                if (NXCore.isEmpty(vs_data)) {
                    this.gf_message_chk("200", this.gf_get_trans_word("품목분류"));
                    this.gf_cursor_setting(this.grd_List, i, "ITNBR");
                    this.Tab00.tabpage1.Div_Detail.edt_itcls.setFocus();  // cursor set
                    return false;
                }
                vs_data = this.ds_List.getColumn(vi_row, "ITDSC");
                if (NXCore.isEmpty(vs_data)) {
                    this.gf_message_chk("200", this.gf_get_trans_word("품명"));
                    this.gf_cursor_setting(this.grd_List, i, "ITNBR");
                    this.Tab00.tabpage1.Div_Detail.edt_itdsc.setFocus();  // cursor set
                    return false;
                }
                vs_data = this.ds_List.getColumn(vi_row, "GBGUB");
                if (NXCore.isEmpty(vs_data)) {
                    this.gf_message_chk("200", this.gf_get_trans_word("개발구분"));
                    this.gf_cursor_setting(this.grd_List, i, "ITNBR");
                    this.Tab00.tabpage1.Div_Detail.cbo_gbgub.setFocus();  // cursor set
                    return false;
                }

                if (this.ds_Head.getColumn(0, "ARG_GBGUB") == "2") {
                    this.gf_message_chk("100248", "");  // 개발부서는 개발품만 수정 및 등록 가능합니다.
                    this.gf_cursor_setting(this.grd_List, i, "ITNBR");
                    this.Tab00.tabpage1.Div_Detail.cbo_gbgub.setFocus();  // cursor set
                    return false;
                }

                if (vs_Ittyp == "1" || vs_Ittyp == "2") {
                    vs_data = this.ds_List.getColumn(vi_row, "FACGBN");
                    if (NXCore.isEmpty(vs_data)) {
                        this.gf_message_chk("200", this.gf_get_trans_word("제조공장"));
                        this.gf_cursor_setting(this.grd_List, i, "FACGBN");
                        this.Tab00.tabpage1.Div_Detail.cbo_facgbn.setFocus();  // cursor set
                        return false;
                    }
                }

                vs_data = this.ds_List.getColumn(vi_row, "UNMSR");
                if (NXCore.isEmpty(vs_data)) {
                    this.gf_message_chk("200", this.gf_get_trans_word("관리단위"));
                    this.gf_cursor_setting(this.grd_List, i, "UNMSR");
                    this.Tab00.tabpage2.Div_Detail.cbo_unmsr.setFocus();  // cursor set
                    return false;
                }

                if (NXCore.isEmpty(this.ds_List.getColumn(vi_row, "ISPEC"))) {
                    this.ds_List.setColumn(vi_row, "ISPEC", '.');
                }

                vs_data = this.ds_List.getColumn(vi_row, "MB_IDX");
                if (!NXCore.isEmpty(vs_data) && vs_data.length > 6) {
                    this.gf_message_chk("790", this.gf_get_trans_word("Membrane 식별번호") + " (6)");  // 자릿수가 맞지 않습니다.
                    this.gf_cursor_setting(this.grd_List, i, "UNMSR");
                    this.Tab00.tabpage2.Div_Detail.cbo_unmsr.setFocus();  // cursor set
                    return false;
                }

                // 추가, 수정에 전역변수를 이용하여 입력자 입력 및 DISP 처리 
                if (this.ds_List.getRowType(i) == 2) {
                    this.ds_List.setColumn(i, "CRT_USER", application.gvs_empid);
                }
                else {
                    this.ds_List.setColumn(i, "UPD_USER", application.gvs_empid);
                }

                if (NXCore.isEmpty(this.ds_List.getColumn(i, "SAUPJ1")) || this.ds_List.getRowType(i) == 2) {

                    //사업장 만큼 DISP_ITTYP에 입력하기 
                    var vs_sql = "SELECT RFGUB AS SAUPJ FROM REFFPF WHERE RFCOD = '02' AND RFGUB <> '00'";
                    this.gf_SelectSql_sync("ds_Temp : " + vs_sql, "TEMP_SELECT", "ff_Callback_sync");

                    if (this.ds_Temp.rowcount == 1) {
                        this.ds_List.setColumn(i, "SAUPJ1", this.ds_Temp.getColumn(0, "SAUPJ"));
                        this.ds_List.setColumn(i, "DISP_ITTYP1", this.ds_List.getColumn(i, "ITTYP"));
                    }
                    else if (this.ds_Temp.rowcount > 1 && this.ds_Temp.rowcount <= 5) {
                        for (var k = 0; k < this.ds_Temp.rowcount; k++) {
                            var vs_Saupj_Name = "SAUPJ" + (k + 1);
                            var vs_Disp_Name = "DISP_ITTYP" + (k + 1);

                            this.ds_List.setColumn(i, vs_Saupj_Name, this.ds_Temp.getColumn(k, "SAUPJ"));
                            this.ds_List.setColumn(i, vs_Disp_Name, this.ds_List.getColumn(i, "ITTYP"));
                        }
                    }
                    else {
                        this.ds_List.setColumn(i, "SAUPJ1", this.ds_Head.getColumn(0, "ARG_SAUPJ"));
                        this.ds_List.setColumn(i, "DISP_ITTYP1", this.ds_List.getColumn(i, "ITTYP"));
                    }
                }
            }
            break;

        //기술정보, 작업장 체크  
        case "pdt_team":
            //변경 된 값만 찾아서 처리함.
            for (i = 0; i < this.ds_Pdt_team.rowcount; i++) {
                // 추가나 수정된 로우를 찾는다.
                vi_row = this.ds_Pdt_team.findRowExpr("(this.getRowType(rowidx)==4)||(this.getRowType(rowidx)==2)", i);
                if (vi_row < 0) break;
                i = vi_row;

                vs_data = this.ds_Pdt_team.getColumn(vi_row, "WKCTR");
                if (NXCore.isEmpty(vs_data)) {
                    this.gf_message_chk("200", this.gf_get_trans_word("작업장"));
                    this.gf_cursor_setting(this.Tab00.tabpage1.grd_Pdt_team, i, "WKCTR");
                    return false;
                }

                if (this.ds_Pdt_team.getColumn(vi_row, "PDRATE") > 100) {
                    this.gf_message_chk("101354", this.gf_get_trans_word("생산비율"));  // 비율의 합이 100이 넘었습니다.
                    this.gf_cursor_setting(this.Tab00.tabpage1.grd_Pdt_team, i, "PDRATE");
                    return false;
                }
            }
            break;

        //거래처 품번정보  
        case "C":
            //변경 된 값만 찾아서 처리함.
            for (i = 0; i < this.ds_Cust_item.rowcount; i++) {
                // 추가나 수정된 로우를 찾는다.
                vi_row = this.ds_Cust_item.findRowExpr("(this.getRowType(rowidx)==4)||(this.getRowType(rowidx)==2)", i);
                if (vi_row < 0) break;
                i = vi_row;

                vs_data = this.ds_Cust_item.getColumn(vi_row, "CVCOD");
                if (NXCore.isEmpty(vs_data)) {
                    this.gf_message_chk("200", this.gf_get_trans_word("거래처"));
                    this.gf_cursor_setting(this.Tab00.tabpage4.grd_List_itmbuy, i, "CVCOD");
                    return false;
                }
            }
            break;

        //수정모드  
        case "M":
            break;
    }

    return true;
}

// @@@@@@@@@@@@@
// 품번 자동 생성 
this.ff_itnbr_make = function (arg_itnbr_13) {
    /*
    var vs_itnbr = this.ds_List.getCaseMax("ITNBR >= '" + arg_itnbr_13 + "' && ITNBR < '" + arg_itnbr_13 + "ㅎㅎㅎㅎㅎ'", "ITNBR" );

    if (vs_itnbr.length == 13) {
        return vs_itnbr + "00001";
    }
    else {
        return arg_itnbr_13 + this.gf_NumToStr(parseInt(vs_itnbr.substr(13, 5)) + 1, 5);
    }
    */

    var vs_itnbr = this.ds_List.getCaseMax("ITNBR >= '" + arg_itnbr_13 + "' && ITNBR < '" + arg_itnbr_13 + "ㅎㅎㅎㅎㅎ'", "ITNBR");
    if (vs_itnbr.length == 13) {
        vs_itnbr = vs_itnbr + "00001";
    }
    else {
        vs_itnbr = arg_itnbr_13 + this.gf_NumToStr(parseInt(vs_itnbr.substr(13, 5)) + 1, 5);
    }

    // 중복 체크 
    var vs_sql = " SELECT NVL(MAX(ITNBR), 'X') AS  MAX_ITNBR FROM ITEMAS WHERE ITNBR  = '" + vs_itnbr + "'";
    this.gf_SelectSql_sync("ds_Temp : " + vs_sql, "CODE_SELECT", "ff_Callback_sync");
    if (this.ds_Temp.rowcount < 1 || this.ds_Temp.getColumn(0, "MAX_ITNBR") == "X") return vs_itnbr;   // 중복 아님 

    // 중복 이므로 번호 생성  
    vs_sql = " SELECT NVL(MAX(ITNBR), 'X') AS  MAX_ITNBR FROM ITEMAS WHERE ITNBR  LIKE '" + arg_itnbr_13 + "%'";
    this.gf_SelectSql_sync("ds_Temp : " + vs_sql, "CODE_SELECT", "ff_Callback_sync");

    if (this.ds_Temp.rowcount < 1 || this.ds_Temp.getColumn(0, "MAX_ITNBR") == "X") return vs_itnbr;

    return arg_itnbr_13 + this.gf_NumToStr(parseInt(this.ds_Temp.getColumn(0, "MAX_ITNBR").substr(13, 5)) + 1, 5);
}
// @@@@@@@@@@@@@

// Transaction 처리
this.ff_Tran = function (strSvcId) {
    switch (strSvcId) {

        case "SELECT_UDI":
            // 2018.06.05 KSM UDI 추가 
            // UDI 탭 조회

            var vs_prodnm = this.ds_List.getColumn(this.ds_List.rowposition, 'PRODNM');

            this.ds_udi_Head.setColumn(0, "ARG_SUPER_CLASS", 'PDM');
            this.ds_udi_Head.setColumn(0, "ARG_SUB_CLASS", 'UDI-MAIN');
            this.ds_udi_Head.setColumn(0, "ARG_HEAD", '%');
            this.ds_udi_Head.setColumn(0, "ARG_ITNBR_P", vs_prodnm);

            // PDM 데이터 NB DB 에서 관리  dbconn=2  
            v_SvcAct = "bc/bcin/bc_bcin_itemas_pdm_u_data_3q.jsp?dbconn=2";
            v_OutDataset = "ds_udi=output1";  // 반드시 output1으로 기술할것
            v_InDataset = "ds_para=ds_udi_Head";     // 반드시 기술할것
            v_Argument = "";

            break;


        case "SELECT_MASTER":
            // 좌측 목록 조회 

            if (NXCore.isEmpty(this.ds_Head.getColumn(0, "ARG_ITNBR2"))) {
                this.ds_Head.setColumn(0, "ARG_ITNBR_P", '%');
            } else {
                this.ds_Head.setColumn(0, "ARG_ITNBR_P", this.ds_Head.getColumn(0, "ARG_ITNBR2"));
            }
            v_SvcAct = pvs_SvcAct;		// bi/item/bi_item_itemas_neo_e_1q.jsp
            v_OutDataset = pvs_OutDataset;	// ds_List=output1
            v_InDataset = pvs_InDataset;	// ds_para=ds_Head
            v_Argument = "";

            break;
        case "SELECT_ITMBUY":
            // 거래처품번정보 탭 조회 

            //폼 변경으로 인해 변수에서 입력하고 처리 
            v_SvcAct = "bi/item/bi_item_itemas_e_2q.jsp";
            v_OutDataset = "ds_Cust_item=output1";  // 반드시 output1으로 기술할것		  		   
            v_InDataset = "ds_para=ds_Head";     // 반드시 기술할것	
            v_Argument = "";

            break;
        case "SELECT_CHANGE":
            // 넘겨줄 파라메터 셋팅

            if (this.ds_List.rowcount < 1) return;

            this.ds_Head.setColumn(0, "ARG_ITNBR", this.ds_List.getColumn(this.ds_List.rowposition, "ITNBR"));

            v_SvcAct = "bi/item/bi_item_itemas_e_3q.jsp";
            v_OutDataset = "ds_Change=output1";  // 반드시 output1으로 기술할것		  		   
            v_InDataset = "ds_para=ds_Head";     // 반드시 기술할것	
            v_Argument = "";

            break;
        case "SELECT_PDT_TEAM":
            // 기술정보탭내 작업장, 생산팀정보 그리드 조회 

            if (this.ds_List.rowcount < 1) return;

            this.ds_Head.setColumn(0, "ARG_ITNBR", this.ds_List.getColumn(this.ds_List.rowposition, "ITNBR"));

            v_SvcAct = "bi/item/bi_item_itemas_e_4q.jsp";
            v_OutDataset = "ds_Pdt_team=output1";  // 반드시 output1으로 기술할것		  		   
            v_InDataset = "ds_para=ds_Head";     // 반드시 기술할것	
            v_Argument = "";

            break;
        case "SELECT_IMG":
            // 도면보기 탭 조회 

            if (this.ds_List.rowcount < 1) return;

            this.ds_Head.setColumn(0, "ARG_FILE_KEY", this.ds_List.getColumn(this.ds_List.rowposition, "ENGNO"));

            v_SvcAct = "bi/item/bi_item_itemas_e_5q.jsp";
            v_OutDataset = "ds_Img=output1";  // 반드시 output1으로 기술할것		  		   
            v_InDataset = "ds_para=ds_Head";     // 반드시 기술할것	
            v_Argument = "";

            break;
        case "SELECT_SEIL":
            if (this.ds_List.rowcount < 1) return;
            this.ds_Head.setColumn(0, "ARG_ITNBR", this.ds_List.getColumn(this.ds_List.rowposition, "ITNBR"));
            v_SvcAct = "bi/item/bi_item_itemas_e_6q.jsp?dbconn=2"; 	// 세일품목은 NB에서만 관리함.
            v_OutDataset = "ds_Seil=output1";
            v_InDataset = "ds_para=ds_Head";
            v_Argument = "";
            break;
        case "SELECT_SEIL_EXCEL":
            //trace(this.ds_Head.saveXML());
            v_SvcAct = "bi/item/bi_item_itemas_e_7q.jsp?dbconn=2"; 	// 세일품목은 NB에서만 관리함.
            v_OutDataset = "ds_Seil_Excel=output1";
            v_InDataset = "ds_para=ds_Head";
            v_Argument = "";
            break;
        case "SAVE_MASTER":
            //trace(this.ds_List.saveXML());
            // 기본 저장 위치 RUNNEOHQ으로 저장으로 NEODEV1 개발 테스트 시 주의 필요!!!!!!  	
            v_SvcAct = pvs_Save_SvcAct;		// bi/item/bi_item_itemas_e_1tr.jsp?dbconn=2
            v_InDataset = pvs_Save_InDataset;	// input1=ds_List:U input2=ds_List:U input3=ds_List:U input4=ds_List:U input5=ds_List:U
            v_OutDataset = pvs_Save_OutDataset;	// ""
            break;
        case "SAVE_ITMBUY":
            v_SvcAct = "bi/item/bi_item_itemas_e_2tr.jsp?dbconn=2";
            v_InDataset = "input1=ds_Cust_item:U ";
            v_OutDataset = "";
            break;
        case "SAVE_PDT_TEAM":
            v_SvcAct = "bi/item/bi_item_itemas_e_4tr.jsp?dbconn=2";
            v_InDataset = "input1=ds_Pdt_team:U ";
            v_OutDataset = "";
            break;
        case "SAVE_SEIL":
            this.ds_Seil.setColumn(0, "형번", this.ds_List.getColumn(this.ds_List.rowposition, "ITNBR"));
            this.ds_Seil.setColumn(0, "CRT_USER", application.gvs_userid);
            this.ds_Seil.setColumn(0, "UPD_USER", application.gvs_userid);
            v_SvcAct = "bi/item/bi_item_itemas_e_6tr.jsp?dbconn=2";
            v_InDataset = "input1=ds_Seil:U ";
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
        case "SELECT_UDI":
            break;
        case "SELECT_MASTER":
            //trace(this.ds_Head.saveXML());	
            if (this.ds_List.rowcount < 1) {
                this.gf_message_chk("110", ""); // 조회 및 출력할 자료가 없습니다.
            }
            else {
                //this.ds_List.set_keystring("S:+ITNBR+ITDSC+ISPEC"); 
                this.grd_List.selectRow(0);
                this.Tab00.tabpage1.Div_Detail.edt_itnbr.set_readonly(true);
                this.Tab00.tabpage1.Div_Detail.edt_itnbr.set_cssclass("readonly");
                //조회 되면서 거래처품목정보 조회 
                this.ds_Head.setColumn(0, "ARG_ITNBR", this.ds_List.getColumn(0, "ITNBR"));
            }

            if (this.ds_Temp2.rowcount > 0) {
                alert("EXCEL UPLOAD 처리 완료");
                this.ds_Temp2.clearData();
            }

            this.ff_excel_upload_btn_set();

            break;
        case "SELECT_CHANGE":
            this.ff_Tran("SELECT_PDT_TEAM");
            break;
        case "SELECT_ITMBUY":
            break;
        case "SELECT_IMG":
            if (this.ds_Img.rowcount > 0) {
                this.Tab00.tabpage5.set_enable(true);
            }
            else {
                this.Tab00.tabpage5.set_enable(false);
                if (this.Tab00.tabindex == 4) {
                    this.Tab00.tabpage5.img_pic.set_image("");
                }
            }
            break;
        case "SELECT_SEIL":
            break;
        case "SELECT_SEIL_EXCEL":
            if (this.ds_Seil_Excel.rowcount > 0) {
                this.gf_excel_download(this.Tab00.tabpage7.Div_Detail.grd_Seil_Excel, "세일전체매칭품목_" + this.gf_today(), "A");
            }
            break;
        case "SAVE_MASTER":
            if (NXCore.isModified(this.ds_Pdt_team)) {
                this.ff_Tran("SAVE_PDT_TEAM");
            }
            if (NXCore.isModified(this.ds_Seil)) {
                this.ff_Tran("SAVE_SEIL");
            }

            //else
            //this.ff_Tran("SELECT_MASTER");

            break;
        case "SAVE_ITMBUY":
            if (this.ds_Cust_item.rowcount > 0) {
                //this.ds_Cust_item.set_keystring("S:+SEQNO"); 
                this.Tab00.tabpage4.grd_List_itmbuy.selectRow(0);
            }
            break;
        case "SAVE_PDT_TEAM":
            //this.ff_Tran("SELECT_MASTER");
            break;
        case "SAVE_SEIL":
            this.ff_Tran("SELECT_MASTER");
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
/*pupup(file upload)의 콜백함수 처리*/
this.ff_AfterPopup_upload = function (strId, obj) {
    if (strId == 'file_upload') {
        if (!NXCore.isEmpty(obj)) {
            this.ds_List.setColumn(this.ds_List.rowposition, 'ENGNO', obj);
            this.Tab00.tabpage1.Div_Detail.img_Filekey.set_visible(true);	//첨부파일 이미지 표시
            this.ff_Tran("SAVE_MASTER");
        }
        else {
            this.ds_List.setColumn(this.ds_List.rowposition, 'ENGNO', obj);
            this.Tab00.tabpage1.Div_Detail.img_Filekey.set_visible(false);	//첨부파일 이미지 표시
            this.ff_Tran("SAVE_MASTER");
        }
    }
}

/* =============================================================================
     이미지 보여주기 
   ============================================================================= */
this.ff_img_show = function () {
    var vn_row = this.ds_Img.rowposition;

    if (NXCore.isEmpty(this.ds_Img.getColumn(vn_row, "FILE_NAME"))) {
        this.Tab00.tabpage5.img_pic.set_image("");
    }
    else {
        var vs_rtn = this.gf_image_url(this.ds_Img.getColumn(vn_row, "FILE_PATH"), this.ds_Img.getColumn(vn_row, "FILE_NAME"));
        // trace(vs_rtn);
        this.Tab00.tabpage5.img_pic.set_image(vs_rtn);
    }
}

/* =============================================================================
     이미지 자세히 보기 
   ============================================================================= */
this.ff_img_fullsize_show = function () {
    if (NXCore.isEmpty(this.ds_List.getColumn(this.ds_List.rowposition, "ENGNO"))) return;

    var resultForm = this.gf_showPopup("filedownload", "co_syst::co_syst_filedownload_only_popup.xfdl", { width: 592, height: 217 },
        {
            A: 'bi/item',
            B: this.ds_List.getColumn(this.ds_List.rowposition, "ENGNO")
        }, { callback: "ff_AfterPopup_upload" });
}

//데이타셋 row 변경시 첨부파일 표시용
this.ff_object_onrowposchanged = function (obj: Dataset, e: nexacro.DSRowPosChangeEventInfo) {
    if (e.newrow < 0) return;

    // this.Tab00.tabindex : 0 기술정보, 1 일반정보, 2 MRP정보, 3 거래처품번정보, 4 도면보기, 5 UDI, 6 세일 
    if (obj.id == 'ds_List') {	// ds_List Dataset 변경시 
        if (this.Tab00.tabindex == 0) {	// 조회를 했는데 Tab이 기술정보이면 ff_Tran("SELECT_CHANGE") 수행.
            this.ff_Tran("SELECT_CHANGE");
        }
        this.ff_Tran("SELECT_ITMBUY");
        this.ff_Tran("SELECT_UDI");
        this.ff_Tran("SELECT_IMG");

        if (NXCore.isEmpty(this.ds_List.getColumn(e.newrow, 'ENGNO'))) {
            this.Tab00.tabpage1.Div_Detail.img_Filekey.set_visible(false);
        }
        else {
            this.Tab00.tabpage1.Div_Detail.img_Filekey.set_visible(true);
        }

        this.ff_Tran("SELECT_SEIL");

    }
}

this.grd_List_onsetfocus = function (obj: Grid, e: nexacro.SetFocusEventInfo) {
    fvs_prc_ds = "ds_List";
}

this.Tab00_onchanged = function (obj: Tab, e: nexacro.TabIndexChangeEventInfo) {
    this.ds_Pdt_team.clearData();

    if (e.postindex == 0) {
        this.parent.parent.div_btnList.ButtonInfo = 'copy,add,delete';
        this.parent.parent.div_btnList.ff_enable_button();
    }
    else {
        this.parent.parent.div_btnList.ButtonInfo = 'copy,add,delete';
        this.parent.parent.div_btnList.ff_disable_button();
    }

    if (e.postindex == 4 && this.ds_Img.rowcount > 0) {
        this.ff_img_show()
    }

    if (e.postindex == 5) {
        this.Div_udi.bringToPrev();
        this.Div_udi.set_right(0);
        this.Div_udi.set_visible(true);

    } else {
        //this.Tab00.bringToPrev();
        this.Div_udi.set_right(-1000);
        this.Div_udi.set_visible(false);
    }

    fvs_prc_ds = "ds_List";
}

this.Tab00_tabpage1_grd_Pdt_team_onsetfocus = function (obj: Grid, e: nexacro.SetFocusEventInfo) {
    fvs_prc_ds = "ds_Pdt_team";
}

this.ds_Img_onrowposchanged = function (obj: Dataset, e: nexacro.DSRowPosChangeEventInfo) {
    if (this.Tab00.tabindex == 4)
        this.ff_img_show();  // 이미지 보여 주기 
}

// 중복 모델명 점검. (제품,상품)
this.Div_Head_btn_dup_chk_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    // 중복대상 칼럼 : 모델명
    var vs_Col = 'PRODNM';
    var vs_Colnm = '모델명';


    var vs_sql = " SELECT ROW_NUMBER() OVER( ORDER BY 1) AS NO " + '\n';
    vs_sql += " , " + vs_Col + " AS 중복_" + vs_Colnm + '\n';
    vs_sql += "  , COUNT(*) 중복건수 " + '\n';
    vs_sql += "  , LISTAGG( ITNBR, ', ') WITHIN GROUP (ORDER BY ITNBR) AS 중복형번_LIST " + '\n';
    //	vs_sql += "  , LISTAGG( GBDATE, ', ') WITHIN GROUP (ORDER BY GBDATE) AS 개발완료일_LIST   "	+ '\n';
    vs_sql += "  , MAX(FUN_GET_REFFPF('05',ITTYP)) AS 품목구분   " + '\n';
    vs_sql += "  , MAX(FUN_GET_ITNCT(ITTYP,ITCLS)) AS 품목분류   " + '\n';
    vs_sql += "  , MAX(ITDSC) AS 품명   " + '\n';
    vs_sql += "  , MAX(ISPEC) AS 규격	" + '\n';
    vs_sql += " FROM ITEMAS         " + '\n';
    vs_sql += " WHERE ITTYP IN ('1', '7')  " + '\n';
    vs_sql += " GROUP BY " + vs_Col + '\n';
    vs_sql += " HAVING COUNT(*) > 1 " + '\n';
    vs_sql += " ORDER BY MAX(ITTYP), MAX(ITCLS), MAX(ITNBR) ";


    // trace(vs_sql);

    var vs_arg = "중복 " + vs_Colnm + "분석|" + vs_sql;

    var resultForm = this.gf_showPopup(vs_arg, "bc_bcin::bc_bcin_sqledit_url_q.xfdl", { width: 1000, height: 800 },
        {
            OpenRetv: 'Y',   // popup open 즉시 조회  
            MultSelect: 'N',   	// MULTI LINE 선택
            Argument: vs_arg
        }, { modal: false, layered: true, autosize: false, showtitlebar: true, resizable: true, callback: "ff_AfterPopup_memo" });
}

this.Div_Head_btn_search_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vs_srch = this.ds_Head.getColumn(0, "ARG_SEARCH");

    if (NXCore.isEmpty(vs_srch) || vs_srch == "") {
        this.Div_Head.edt_search.setFocus();
        this.gf_message_chk("200", this.gf_get_trans_word("찾기 글자"));
        return;
    }

    var vn_row = this.ds_List.rowposition + 1;

    var vn_row = this.ds_List.findRowExpr("ITNBR.toUpperCase().indexOf('" + vs_srch + "')>=0 || PRODNM.toUpperCase().indexOf('" + vs_srch + "')>=0 || ITDSC.toUpperCase().indexOf('" + vs_srch + "')>=0 || ISPEC.toUpperCase().indexOf('" + vs_srch + "')>=0", vn_row);
    if (vn_row < 0) {
        this.gf_message_chk("440", this.gf_get_trans_word("찾기 글자"));  // 찾을 자료가 없습니다.
        return;
    }
    else {
        this.grd_List.selectRow(vn_row, true);
    }
}

// 조회.
this.Div_Head_edt_itnbr_onchanged = function (obj: Edit, e: nexacro.ChangeEventInfo) {
    if (NXCore.isEmpty(e.posttext) || e.posttext == "") return;

    this.btn_query_onclick();
}



this.ff_set_udi = function () {

    var vs_super = 'PDM';
    var vs_sub = 'UDI-MAIN';

    if (NXCore.isEmpty(vs_super) || vs_super == '%') {
        return;
    }
    if (NXCore.isEmpty(vs_sub) || vs_sub == '%' || vs_sub == '*') {
        return;
    }

    this.ds_udi_Head.clearData();
    this.ds_udi_Head.addRow();

    this.ds_udi_Head.setColumn(0, 'ARG_SUPER_CLASS', vs_super);
    this.ds_udi_Head.setColumn(0, 'ARG_SUB_CLASS', vs_sub);

    this.ds_udi.clearData();

    //this.ff_class_def_set( this.Tab00.tabpage6.Div_udi , vs_super, vs_sub, this.ds_udi);

    this.ff_class_def_set(this.Div_udi, vs_super, vs_sub, this.ds_udi);

}


/*****************************************************************************************
 * 함  수  명	: 	ff_class_def_set
 * 아규먼트 	: 	obj : Grd, Div   예) this.grd_List, 
 *              :   2017.08.31 KSM 
 * 기      능	: 	해당 grid 중 class_object 정의에 따라 Setting 
 *****************************************************************************************/
this.ff_class_def_set = function (obj, arg_Super, arg_Sub, arg_ds) {
    var vs_sub_class, vs_super_class;
    var vs_arg;
    var lb_lock_chk = true;

    vs_super_class = arg_Super;
    vs_sub_class = arg_Sub;

    if (NXCore.isEmpty(vs_super_class)) {
        vs_super_class = '*';
    }
    if (NXCore.isEmpty(vs_sub_class)) {
        vs_sub_class = '*';
    }

    var vSql;
    var objDelete = this.removeChild("ds_select_Class");
    // var ds_select_Class = new Dataset;
    ds_select_Class = new Dataset;
    var vi_idx = this.addChild("ds_select_Class", ds_select_Class);
    ds_select_Class.clearData();

    vSql = "";
    vSql += "	    SELECT SUPER_CLASS     ";
    vSql += "	          ,SUB_CLASS     ";
    vSql += "	          ,CLASS_ID     ";
    vSql += "	          ,DECODE(CLASS_NM,'.','',CLASS_NM)  	as CLASS_NM   ";
    vSql += "	          ,CLASS_SEQ     ";
    vSql += "	          ,COLUMN_ID     ";
    vSql += "	          ,DB_TYPE     ";
    vSql += "	          ,DB_REQUIRED     ";
    vSql += "	          ,GBIND     ";
    vSql += "	          ,GTYPE     ";
    vSql += "	          ,GSIZE     ";
    vSql += "	          ,GMASK     ";
    vSql += "	          ,GCOLOR     ";
    vSql += "	          ,GBACKG     ";
    vSql += "	          ,GALIGN     ";
    vSql += "	          ,GINIT     ";
    vSql += "	          ,GCSS     ";
    vSql += "	          ,GREAD     ";
    vSql += "	          ,GVISIBLE     ";
    vSql += "	          ,FLAG     ";
    vSql += "	          ,A_DATE     ";
    vSql += "	          ,A_NUM     ";
    vSql += "	          ,REMARK     ";
    vSql += "	          ,IMGPATH     ";
    vSql += "	      FROM Z9_CLASS_OBJECT     ";
    vSql += "	     WHERE SUPER_CLASS = '" + vs_super_class + "'     ";
    vSql += "	       AND SUB_CLASS = '" + vs_sub_class + "'     ";
    vSql += "      ORDER BY SUPER_CLASS, SUB_CLASS, NVL(CLASS_SEQ,0), CLASS_ID  ";

    this.gf_SelectSql_sync("ds_select_Class : " + vSql, "ds_select_Class", "ff_Callback_sync");

    var vs_bind;
    var vs_class_nm, vs_gbind, vs_gtype, vs_gsize, vs_gmask, vs_gcolor, vs_required;
    var vs_gbackg, vs_galign, vs_ginit, vs_gcss, vs_gread, vs_gvisible, vs_flag, vs_imgpath;
    var vn_row;
    var bSucc;

    var vds = arg_ds;
    if (NXCore.isEmpty(vds)) return;

    var objDiv = eval("this." + obj.id);
    // var objDiv = eval("this.Tab00.tabpage6.Div_udi");
    // var objDiv = this.Tab00.tabpage6.Div_udi ;

    var objSta;
    var vs_column_id;

    var objStatic = [];
    var objEdit = [];
    var objBind = [];

    var objEditx0, objEditx1, objEditx2, objEditx3, objEditx4, objEditx5, objEditx6;
    var vs_rtn;

    var sizeWidth = objDiv.width;
    var sizeHeight = (this.getOwnerFrame().height - objDiv.top - 80);


    // 초기 init
    var init_left = 20;
    var init_top = 10;
    var init_width = 150;
    var init_height = 20;
    var init_right = null;
    var init_bottom = null;
    var init_gap = 4;

    var vn_left = init_left;
    var vn_top = init_top;
    var vn_width = init_width;
    var vn_height = init_height;
    var init_objwidth = 300;

    var vi_idx;
    var vs_edit_id;
    var obj_edit;

    var arrCpnt = objDiv.components;
    var nCpntCnt = arrCpnt.length;

    for (var k = nCpntCnt; k >= 0; k--) {
        if (NXCore.typeof(arrCpnt[k]) == 'static') {
            vs_rtn = objDiv.removeChild(arrCpnt[k].id);
        }
    }
    var arrCpnt2 = objDiv.components;
    var nCpntCnt2 = arrCpnt2.length;

    for (var l = 0; l < nCpntCnt2; l++) {
        arrCpnt2[l].set_visible(false);
    }

    var j2 = 0;
    for (var j = 0; j < ds_select_Class.rowcount; j++) {
        vs_class_nm = ds_select_Class.getColumn(j, "CLASS_NM");
        vs_column_id = ds_select_Class.getColumn(j, "COLUMN_ID");

        vs_gbind = ds_select_Class.getColumn(j, "GBIND");
        vs_gtype = ds_select_Class.getColumn(j, "GTYPE");
        vs_gsize = ds_select_Class.getColumn(j, "GSIZE");
        vs_gmask = ds_select_Class.getColumn(j, "GMASK");
        vs_gcolor = ds_select_Class.getColumn(j, "GCOLOR");
        vs_gbackg = ds_select_Class.getColumn(j, "GBACKG");
        vs_galign = ds_select_Class.getColumn(j, "GALIGN");
        vs_ginit = ds_select_Class.getColumn(j, "GINIT");
        vs_gcss = ds_select_Class.getColumn(j, "GCSS");
        vs_gread = ds_select_Class.getColumn(j, "GREAD");
        vs_gvisible = ds_select_Class.getColumn(j, "GVISIBLE");
        vs_required = ds_select_Class.getColumn(j, "DB_REQUIRED");
        vs_flag = ds_select_Class.getColumn(j, "FLAG");

        if (vs_gvisible != '1') continue;

        objStatic[j] = new Static();
        objStatic[j].init(objDiv + ".sta_" + j, "absolute", vn_left, vn_top, vn_width, vn_height, init_right, init_bottom);
        vs_rtn = objDiv.addChild(objDiv + ".sta_" + j, objStatic[j]);
        // text set
        objStatic[j].set_text(vs_class_nm);

        // Fix 고정값 
        if (!NXCore.isEmpty(vs_ginit)) {
            objStatic[j].set_text('▼ ' + vs_class_nm);
        }
        objStatic[j].show();

        // edit 
        if (vs_gtype == 'NORMAL') {

            // 				vs_edit_id = "this.Tab00.tabpage6.Div_udi.Edit" + this.gf_NumToStr(j,2);
            // 				obj_edit = eval("this.Tab00.tabpage6.Div_udi.Edit" + this.gf_NumToStr(j,2) );

            vs_edit_id = obj.id + ".Edit" + this.gf_NumToStr(j, 2);
            obj_edit = eval("this." + obj.id + ".Edit" + this.gf_NumToStr(j, 2));

        } else if (vs_gtype == 'COMBO') {
            // combo

            //  				vs_edit_id = "this.Tab00.tabpage6.Div_udi.Combo" + this.gf_NumToStr(j2,2);
            // 				obj_edit = eval("this.Tab00.tabpage6.Div_udi.Combo" + this.gf_NumToStr(j2,2) );		

            vs_edit_id = obj.id + ".Combo" + this.gf_NumToStr(j2, 2);
            obj_edit = eval("this." + obj.id + ".Combo" + this.gf_NumToStr(j2, 2));

            vs_arg = vs_super_class + "|" + vs_sub_class + "|" + vs_column_id;
            this.gf_combo_head_sync(vds.id, vs_column_id, obj_edit, "co_dddw_z9_code_object", vs_arg, 0);

            j2++;

        }

        obj_edit.set_left(vn_left + init_width);
        obj_edit.set_top(vn_top);
        obj_edit.set_width(init_objwidth);
        obj_edit.set_height(vn_height);
        obj_edit.set_right(init_right);
        obj_edit.set_bottom(init_bottom);


        // 초기값.
        obj_edit.set_value(null);
        obj_edit.set_cssclass(null);
        obj_edit.set_readonly(false);


        objBind[j] = new BindItem();
        vi_idx = this.addChild('bind_' + j, objBind[j]);

        // 				trace('vs_edit_id >> ' + vs_edit_id);
        // 				trace('vds.id >> ' + vds.id);
        // 				trace('vs_column_id >> ' + vs_column_id);
        objBind[j].init('bind_' + j, vs_edit_id, "value", vds.id, vs_column_id);

        //objBind[j].init('bind_'+j ,vs_edit_id, "text",  vds.id ,vs_column_id);
        objBind[j].bind();



        obj_edit.set_cssclass('readonly');
        obj_edit.set_readonly(true);

        obj_edit.set_visible(true);

        vn_top = vn_top + vn_height + init_gap;
    }

    objDiv.resetScroll();

}

//---------------------------------------------------------------------------------------
//// 20240321,권한에 따른 저장 여부 체크(상품PM팀은 해당 코드에 id가 등록되어 있음).
//// 참조코드 "G2" 등록 된 품목마스타 엑셀 업로드
//// 품목구분코드가 상품(7)일 경우 만 버튼 활성화
//---------------------------------------------------------------------------------------
this.ff_excel_upload_btn_set = function () {
    var vs_sql;

    vs_sql = " SELECT NVL(COUNT(*), 0) AS REF_CNT "
        + "   FROM REFFPF      	  "
        + "  WHERE RFCOD = 'G2'   "
        + "    AND RFNA1 = '" + application.gvs_userid + "'";
    this.gf_SelectSql_sync("ds_Temp : " + vs_sql, "CODE_SELECT", "ff_Callback_sync");

    if (this.ds_Temp.getColumn(0, "REF_CNT") > 0) {
        if (this.Div_Head.cbo_ittyp.value == '7') {
            this.Tab00.tabpage2.Div_Detail.btn_excl_upload.set_visible(true);
        } else {
            this.Tab00.tabpage2.Div_Detail.btn_excl_upload.set_visible(false);
        }
    } else {
        this.Tab00.tabpage2.Div_Detail.btn_excl_upload.set_visible(false);
    }

}
