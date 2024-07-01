/***********************************************************************
 * 01. Creation date      : 2017.05.17
 * 02. Created by         : 이광용
 * 03. Revision history   : 
 ***********************************************************************/

include "lib::common_form.xjs";
include "sm_co::sm_co_util_neo.xjs";

//
// Region Start: 전역 변수 선언
//

this.vi_ErrorCode = undefined;		// 콜백루틴의 에러코드	싱크트란잭션일경우 사용
this.vs_ErrorMsg = undefined;		// 콜백루틴의 에러메세지	싱크트란잭션일경우 사용
this.fvs_saupcode_visible = "Y";	// 사업장 VISIBLE 여부
this.fvs_saupcode_all = "Y";		// 사업장 전체 여부
this.fvs_companycode = "";
this.fvs_saupcode = "";
this.fvs_input_mode = "I";

//
// Region End: 전역 변수 선언
//

//
// Region Start: 프로그램 시작 및 종료
//

//--------------------------------------------------------------------
// on load event  페이지가 열릴때
//--------------------------------------------------------------------
this.form_onload = function (obj: Form, e: nexacro.LoadEventInfo) {
    this.gf_formOnload(obj);
    this.ff_load(obj);
}

//--------------------------------------------------------------------
//  초기 작업 수행
//--------------------------------------------------------------------
this.ff_load = function (obj) {
    this.ff_SetCondition();	// 초기 조건 파라메터 및 콤보 셋팅
    this.ff_setCombo();
}

//--------------------------------------------------------------------
// 초기 조건 파라메터 및 콤보 셋팅
//--------------------------------------------------------------------
this.ff_SetCondition = function () {
    this.div_input_mode.Div00.btn_Input.set_text(this.gf_get_trans_word("대기"));
    this.div_input_mode.Div00.btn_Modify.set_text(this.gf_get_trans_word("승인"));

    this.gf_mdi_btn_enable("etc1");
    this.gf_mdi_btn_disable("etc2");

    this.ds_head.clearData();
    var vi_row = this.ds_head.addRow();
    this.ff_initial_value("ADD_HEAD", vi_row);
}

//--------------------------------------------------------------------
// 초기 조건 파라메터 및 콤보 셋팅
//--------------------------------------------------------------------
this.ff_setCombo = function () {
    //HEAD
    this.gf_combo_head_sync(this.ds_head, "ARG_JNPCRT", this.div_head.cbo_jnpcrt, "%^" + this.gf_get_trans_word("전체") + "@005^" + this.gf_get_trans_word("과납반품") + "@057^" + this.gf_get_trans_word("불량반품"), "", 0);	//처리구분

    //DETAIL
    this.gf_combo_grd_sync(this.grd_master, "YEBI2", "co_dddw_reffpf_f_10", "", 0);
    //	this.gf_combo_grd_sync(this.grd_master, "GUCOD", "co_dddw_reffpf_f_73", "", 0);
    this.gf_combo_grd_sync(this.grd_master, "GUCOD", "co_dddw_reffpf_f_5m", "", 0);
    this.gf_combo_grd_sync(this.grd_master, "JNPCRT", "005^" + this.gf_get_trans_word("과납반품") + "@057^" + this.gf_get_trans_word("불량반품"), "", 0);
}

//--------------------------------------------------------------------
// 화면을 닫기전에 수정사항이 있으면 저장할것인지 묻는다.
//--------------------------------------------------------------------
this.form_onbeforeclose = function (obj: Form, e: CloseEventInfo) {
    var vb_true = true;

    if (NXCore.isModified(this.ds_master) || NXCore.isModified(this.ds_detail)) {
        // 변경된 자료가 있습니다. 프로그램을 닫으시겠습니까?
        if (this.gf_message_chk("1180", "") == 1)
            vb_true = true;
        else
            vb_true = false;
    }
    else
        vb_true = true;

    return vb_true;
}

//
// Region End: 프로그램 시작 및 종료
//

//
// Region Start: 이벤트
//

//--------------------------------------------------------------------
// 조회 버튼 클릭
//--------------------------------------------------------------------
this.btn_query_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    if (!this.ff_required_chk("SELECT_MASTER")) return;

    this.ff_Tran("SELECT_MASTER");
}

//--------------------------------------------------------------------
// 추가 버튼 클릭
//--------------------------------------------------------------------
this.btn_add_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
}

//--------------------------------------------------------------------
// 삽입 버튼 클릭
//--------------------------------------------------------------------
this.btn_insert_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
}

//--------------------------------------------------------------------
// 삭제 버튼 클릭
//--------------------------------------------------------------------
this.btn_delete_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
}

//--------------------------------------------------------------------
// 저장 버튼 클릭
//--------------------------------------------------------------------
this.btn_save_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
}

//--------------------------------------------------------------------
// 취소 버튼 클릭
//--------------------------------------------------------------------
this.btn_cancel_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
}

//--------------------------------------------------------------------
// 엑셀변환 버튼 클릭
//--------------------------------------------------------------------
this.btn_excel_chg_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
}

//--------------------------------------------------------------------
// 닫기 버튼 클릭
//--------------------------------------------------------------------
this.btn_close_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    this.gf_closeMenu();
}



/********************************************** 
불량반품 승인, 취소 시 창고이동 생성, 삭제
*작성자 : 최문석 *작성일 : 2024.06.28 *작성내용 : 불량반품 승인 시, 창고이동출고(O05) 창고이동입고(I11) 발생 
**********************************************/
this.ff_FaultInsert = function (IOJPNO) {
    this.ds_temp.clear();
    var vs_sql =
        "SELECT * FROM IMHIST_SAL WHERE IOJPNO = '" + IOJPNO + "'";
    this.gf_SelectSql_sync("ds_temp : " + vs_sql, "Temp_Select", null);

    // 전표 채번
    var vs_buljpno = this.fvs_companycode + this.ds_temp.getColumn(0, "SUDAT").substr(2, 6)
        + this.gf_get_junpyo(this.ds_temp.getColumn(0, "SUDAT"), "C0", 4, this.fvs_companycode)
        + this.gf_NumToStr(0, 3);

    // 입고 창고에서 불량 창고로 출고 (수불구분 'O05')
    var vn_outrow = this.ds_imhist.addRow();

    this.ds_imhist.setColumn(vn_outrow, "IOJPNO", parseInt(vs_buljpno) + 1);
    this.ds_imhist.setColumn(vn_outrow, "IOGBN", "O05");
    this.ds_imhist.setColumn(vn_outrow, "ITNBR", this.ds_temp.getColumn(0, "ITNBR"));
    this.ds_imhist.setColumn(vn_outrow, "PSPEC", '.');
    this.ds_imhist.setColumn(vn_outrow, "OPSEQ", '9999');
    this.ds_imhist.setColumn(vn_outrow, "DEPOT_NO", this.ds_temp.getColumn(0, "DEPOT_NO"));
    this.ds_imhist.setColumn(vn_outrow, "CVCOD", "Z10110"); // 불량창고 코드
    this.ds_imhist.setColumn(vn_outrow, "SUDAT", this.ds_temp.getColumn(0, "SUDAT"));
    this.ds_imhist.setColumn(vn_outrow, "INSDAT", this.ds_temp.getColumn(0, "INSDAT"));
    this.ds_imhist.setColumn(vn_outrow, "IO_DATE", vs_today);
    this.ds_imhist.setColumn(vn_outrow, "IOPRC", this.ds_temp.getColumn(0, "IOPRC"));
    this.ds_imhist.setColumn(vn_outrow, "IOQTY", this.ds_temp.getColumn(0, "IOQTY"));
    this.ds_imhist.setColumn(vn_outrow, "IOREQTY", this.ds_temp.getColumn(0, "IOREQTY"));
    this.ds_imhist.setColumn(vn_outrow, "IOAMT", this.ds_temp.getColumn(0, "IOAMT"));
    this.ds_imhist.setColumn(vn_outrow, "YEBI2", this.ds_temp.getColumn(0, "YEBI2"));
    this.ds_imhist.setColumn(vn_outrow, "DYEBI3", 0);
    this.ds_imhist.setColumn(vn_outrow, "CRT_USER", application.gvs_userid);
    this.ds_imhist.setColumn(vn_outrow, "INSEMP", application.gvs_userid);
    this.ds_imhist.setColumn(vn_outrow, "IO_EMPNO", application.gvs_userid);
    this.ds_imhist.setColumn(vn_outrow, "LOTENO", this.ds_temp.getColumn(0, "LOTENO"));
    this.ds_imhist.setColumn(vn_outrow, "IP_JPNO", this.ds_temp.getColumn(0, "IOJPNO"));
    this.ds_imhist.setColumn(vn_outrow, "SAUPJ", this.ds_temp.getColumn(0, "SAUPJ"));
    this.ds_imhist.setColumn(vn_outrow, "INPCNF", "O");
    this.ds_imhist.setColumn(vn_outrow, "FILSK", "Y");
    this.ds_imhist.setColumn(vn_outrow, "IO_CONFIRM", 'Y');
    this.ds_imhist.setColumn(vn_outrow, "QCGUB", "1");
    this.ds_imhist.setColumn(vn_outrow, "JNPCRT", "057");
    this.ds_imhist.setColumn(vn_outrow, "BIGO", this.ds_temp.getColumn(0, "BIGO"));
    this.ds_imhist.setColumn(vn_outrow, "LCLGBN", 'V');

    // 제품창고->불량창고 입고자료..
    var vn_inrow = this.ds_imhist.addRow();
    this.ds_imhist.copyRow(vn_inrow, this.ds_imhist, vn_outrow);

    this.ds_imhist.setColumn(vn_inrow, "IOJPNO", parseInt(vs_buljpno) + 2);
    this.ds_imhist.setColumn(vn_inrow, "IOGBN", "I11");
    this.ds_imhist.setColumn(vn_inrow, "DEPOT_NO", "Z10110"); // 불량창고 코드
    this.ds_imhist.setColumn(vn_inrow, "CVCOD", this.ds_temp.getColumn(0, "DEPOT_NO"));
    this.ds_imhist.setColumn(vn_inrow, "INPCNF", "I");
}

this.ff_FaultDelete = function(IOJPNO) {
    var vs_sql =
        "DELETE FROM IMHIST_SAL WHERE IP_JPNO = '" + IOJPNO + "'";
    this.gf_UpdateSql_sync(vs_sql, "DELETE_FAULT", null);
}
//--------------------------------------------------------------------
// 승인 버튼 클릭
//--------------------------------------------------------------------
this.btn_etc1_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vs_today = this.gf_today();
    this.ds_imhist.clearData();

    for (var i = 0; i < this.ds_master.rowcount; i++) {
        if (this.ds_master.getColumn(i, "CHK") == '0')
            continue;

        if (this.ds_master.getColumn(i, "JNPCRT") == '057') {
            this.ff_FaultInsert(this.ds_master.getColumn(i, "IOJPNO")); //  *작성자 : 최문석 *작성일 : 2024.06.28 *작성내용 : 불량반품 승인 시, 창고이동출고(O05) 창고이동입고(I11) 발생 
        }

        this.ds_master.setColumn(i, "IO_CONFIRM", "Y");
        this.ds_master.setColumn(i, "IO_DATE", vs_today);
        this.ds_master.setColumn(i, "IO_EMPNO", application.gvs_empid);
    }
    trace(this.ds_imhist.saveXML());
    this.ff_Tran("SAVE_MASTER");
}
//--------------------------------------------------------------------
// 승인취소 버튼 클릭
//--------------------------------------------------------------------
this.btn_etc2_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    for (var i = 0; i < this.ds_master.rowcount; i++) {
        if (this.ds_master.getColumn(i, "CHK") == '0')
            continue;
        this.ff_FaultDelete(this.ds_master.getColumn(i, "IOJPNO")) // *작성자 : 최문석 *작성일 : 2024.06.28 *작성내용 : 불량반품 승인 시, 창고이동출고(O05) 창고이동입고(I11) 발생 
        this.ds_master.setColumn(i, "IO_CONFIRM", "N");
        this.ds_master.setColumn(i, "IO_DATE", null);
        this.ds_master.setColumn(i, "IO_EMPNO", null);
    }

    this.ff_Tran("SAVE_MASTER");
}

//-----------------------------------------------------------------
// 자료변경
//-----------------------------------------------------------------
this.ff_Object_onitemchanged = function (obj: Object, e) {
    var vs_data;	//이벤트에서 데이터 값  
    var vn_row;		//해당 row 값  

    // dataset과 다른 object로 나눠서 처리 
    // obj를 dataset를 확인 해서 처리 함.	
    if (obj == '[object Dataset]') {
        vn_row = this.ds_master.rowposition;
        vs_data = e.newvalue;

        // dataset 이름 별로 처리 
        if (obj.id == 'ds_master') {
        }
    }
    else {
        vs_data = e.postvalue;

        if (obj.parent.name == 'div_head') {
            vn_row = this.ds_head.rowposition;

            switch (obj.name) {
                case "edt_cvcod":
                    this.ds_head.setColumn(vn_row, "ARG_CVNAS", "");

                    if (!NXCore.isEmpty(vs_data)) {
                        vs_arg = '1' + "|" + vs_data + "|" + this.ds_head.getColumn(vn_row, "ARG_CVNAS") + "|" + 'S' + "|" + this.fvs_companycode;
                        this.ff_co_popu_call("popup_object_cvcod", vs_arg, "Y");
                    }
                    break;

                case "edt_cvnas":
                    this.ds_head.setColumn(vn_row, "ARG_CVCOD", "");

                    if (!NXCore.isEmpty(vs_data)) {
                        vs_arg = '1' + "|" + this.ds_head.getColumn(vn_row, "ARG_CVCOD") + "|" + vs_data + "|" + 'S' + "|" + this.fvs_companycode;
                        this.ff_co_popu_call("popup_object_cvcod", vs_arg, "Y");
                    }
                    break;
            }

            this.ds_master.clearData();
            this.ds_detail.clearData();
        }
    }
}

//--------------------------------------------------------------------
// MOUSE RIGHT BUTTON 처리 
//--------------------------------------------------------------------
this.ff_Object_onrbuttondown = function (obj: Object, e: nexacro.MouseEventInfo) {
    var vs_data = '', vn_row, vs_arg = '';

    if (obj.readonly) return;	//readonly 상태 이면 팝업 취소 

    if (obj.parent.name == 'div_head') {
        vs_data = obj.value;
        vn_row = this.ds_head.rowposition;

        switch (obj.parent.name) {
            case 'div_head':
                switch (obj.name) {
                    case 'edt_cvcod':
                        vs_arg = '1' + "|" + vs_data + "|" + this.ds_head.getColumn(vn_row, "ARG_CVNAS") + "|" + 'S' + "|" + this.fvs_companycode;
                        this.ff_co_popu_call("popup_object_cvcod", vs_arg, "N");
                        break;

                    case "edt_cvnas":
                        vs_arg = '1' + "|" + this.ds_head.getColumn(vn_row, "ARG_CVCOD") + "|" + vs_data + "|" + 'S' + "|" + this.fvs_companycode;
                        this.ff_co_popu_call("popup_object_cvcod", vs_arg, "Y");
                        break;
                }
                break;
        }
    }
}

//--------------------------------------------------------------------
// ROW CHANGE 처리 
//--------------------------------------------------------------------
this.ds_master_onrowposchanged = function (obj: Dataset, e: nexacro.DSRowPosChangeEventInfo) {
    if (e.newrow == -1) return;

    this.ff_Tran("SELECT_DETAIL");
}

//
// Region End: 이벤트
//

//
// Region Start: 사용자 정의 함수
//

//--------------------------------------------------------------------
// 트랜잭션 처리 
//--------------------------------------------------------------------
this.ff_Tran = function (strSvcId) {
    switch (strSvcId) {
        case "SELECT_MASTER":
            this.ds_master.clearData();
            this.ds_detail.clearData();

            if (this.fvs_input_mode == "I")
                this.ds_head.setColumn(this.ds_head.rowposition, "ARG_IO_CONFIRM", "N");
            else
                this.ds_head.setColumn(this.ds_head.rowposition, "ARG_IO_CONFIRM", "Y");

            v_SvcAct = "sm/sale/sm_sale_sendback_cnf_neo_e_1q.jsp";
            v_InDataset = "ds_para=ds_head";	// 반드시 기술할것
            v_OutDataset = "ds_master=output1";	// 반드시 output1으로 기술할것
            v_Argument = "";
            break;

        case "SELECT_DETAIL":
            this.ds_detail.clearData();

            this.ds_head.setColumn(this.ds_head.rowposition, 'ARG_IOJPNO', this.ds_master.getColumn(this.ds_master.rowposition, "IOJPNO"));

            v_SvcAct = "sm/sale/sm_sale_sendback_cnf_neo_e_2q.jsp";
            v_InDataset = "ds_para=ds_head";    // 반드시 기술할것
            v_OutDataset = "ds_detail=output1";	// 반드시 output1으로 기술할것
            v_Argument = "";
            break;

        case "SAVE_MASTER":
            v_SvcAct = "sm/sale/sm_sale_sendback_cnf_neo_e_1tr.jsp";
            v_InDataset = "input1=ds_master:U input2=ds_imhist:U";	// 반드시 input1으로 기술할것
            v_OutDataset = "";
            break;
    }

    this.gf_Transaction_Async(strSvcId, v_SvcAct, v_InDataset, v_OutDataset, "ff_Callback");
}

//--------------------------------------------------------------------
// 콜백 함수 처리 
//--------------------------------------------------------------------
this.ff_Callback = function (sSvcID, ErrorCode, ErrorMsg) {
    this.vi_ErrorCode = ErrorCode;
    this.vs_ErrorMsg = ErrorMsg;

    if (ErrorCode < 0) {
        NXCore.alert('CallBack ERR = ' + ErrorMsg + ErrorCode);
        return;
    }

    switch (sSvcID) {
        case "SELECT_MASTER":
            if (this.ds_master.rowcount < 1) {
                this.gf_message_chk("110", "MASTER"); // 조회 및 출력할 자료가 없습니다.
            }
            break;

        case "SELECT_DETAIL":
            // 			if (this.ds_detail.rowcount < 1)
            // 			{
            // 				this.gf_message_chk("110", "DETAIL"); // 조회 및 출력할 자료가 없습니다.
            // 			}
            break;

        case "SAVE_MASTER":
            if (this.fvs_input_mode == "I") {
                this.gf_message_chk("103915", "");	//승인 완료
            }
            else {
                this.gf_message_chk("121596", "");	//승인취소 완료
            }
            this.ff_Tran("SELECT_MASTER");
            break;
    }
}

//--------------------------------------------------------------------
// pupup 호출함수 처리
//--------------------------------------------------------------------
this.ff_co_popu_call = function (strId, strArg, strAuto) {
    if (NXCore.isEmpty(strAuto) || strAuto == null)
        strAuto = 'N';

    switch (strId) {
        case 'popup_object_cvcod':			// 고객
            var resultForm = this.gf_showPopup(strId, "co_popu::co_popu_vndmst_f.xfdl", { width: 10, height: 20 },
                {
                    OpenRetv: 'Y',   			// popup open 즉시 조회  
                    MultSelect: 'N',   			// MULTI LINE 선택
                    AutoConfirm: strAuto,		// Auto Confirm 여부
                    Argument: strArg  		// 조회조건 파라메터 
                }, { callback: "ff_AfterPopup" });
            break;
    }
}

//--------------------------------------------------------------------
// pupup의 콜백함수 처리
//--------------------------------------------------------------------
this.ff_AfterPopup = function (strId, obj) {
    var va_data = this.gf_popup_data(obj);  // popup 에서 넘어온 data 를 array 로 받아온다.

    if (!va_data) return;  // 자료 없음 

    switch (strId) {
        case "popup_object_cvcod":
            for (var i = 0; i < va_data.length; i++) {
                this.ds_head.setColumn(this.ds_head.rowposition, 'ARG_CVCOD', va_data[i][0]);
                this.ds_head.setColumn(this.ds_head.rowposition, 'ARG_CVNAS', va_data[i][3]);
            }
            break;
    }
}

//--------------------------------------------------------------------
// 필수 입력 항목 체크
//--------------------------------------------------------------------
this.ff_required_chk = function (sSvcID) {
    // 조회(R), 삭제(D), 저장(S) 에서 필수 값 체크 
    // 가능하면 HEAD, MASTER까지 모두 여기서 체크, 처리 해주세요.	
    switch (sSvcID) {
        case "SELECT_MASTER":	//조회
            var vs_sdate = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_SDATE");
            var vs_edate = this.ds_head.getColumn(this.ds_head.rowposition, "ARG_EDATE");

            if (NXCore.isEmpty(vs_sdate) || vs_sdate == '') {
                this.gf_message_chk("200", this.gf_get_trans_word("반품일자(FROM)"));	//필수입력항목이므로 반드시 입력해야 합니다!!
                this.div_head.cal_sdate.setFocus();  // cursor set
                return false;
            }

            if (this.gf_datecheck(vs_sdate) == -1) {
                this.gf_message_chk("102359", this.gf_get_trans_word("반품일자(FROM)"));	//일자형식이 잘못 지정되었습니다.
                this.div_head.cal_sdate.setFocus();  // cursor set
                return false;
            }

            if (NXCore.isEmpty(vs_edate) || vs_edate == '') {
                this.gf_message_chk("200", this.gf_get_trans_word("반품일자(TO)"));	//필수입력항목이므로 반드시 입력해야 합니다!!
                this.div_head.cal_edate.setFocus();  // cursor set
                return false;
            }

            if (this.gf_datecheck(vs_edate) == -1) {
                this.gf_message_chk("102359", this.gf_get_trans_word("반품일자(TO)"));	//일자형식이 잘못 지정되었습니다.
                this.div_head.cal_edate.setFocus();  // cursor set
                return false;
            }

            if (vs_sdate > vs_edate) {
                this.gf_message_chk("102929", this.gf_get_trans_word("반품일자"));	//조회기간을 정확히 입력하십시오.
                this.div_head.cal_sdate.setFocus();  // cursor set
                return false;
            }
            break;

        // 		case "SAVE_MASTER" :	//저장
        // 			break;
    }

    return true;
}

//--------------------------------------------------------------------
// 추가나 삽입시 초기값 Setting
//--------------------------------------------------------------------
this.ff_initial_value = function (sSvcID, iRow) {
    switch (sSvcID) {
        case "ADD_HEAD":	// 조건 추가
            var vs_today = this.gf_today();

            this.ds_head.setColumn(iRow, "ARG_COMPCOD", application.gvs_companycode);
            this.ds_head.setColumn(iRow, "ARG_SAUPJCOD", application.gvs_defsaupj);
            this.ds_head.setColumn(iRow, "ARG_SDATE", vs_today.substr(0, 6) + "01");
            this.ds_head.setColumn(iRow, "ARG_EDATE", vs_today);
            this.ds_head.setColumn(iRow, "ARG_IOGBN", "O41");	//매출반품
            this.ds_head.setColumn(iRow, "ARG_JNPCRT", "%");
            this.ds_head.setColumn(iRow, "ARG_CVCOD", "");
            this.ds_head.setColumn(iRow, "ARG_CVNAS", "");
            this.ds_head.setColumn(iRow, "ARG_IO_CONFIRM", "N");
            this.ds_head.setColumn(iRow, "ARG_LANG", application.gv_lang);
            this.ds_head.setColumn(iRow, "ARG_IOJPNO", "");

            this.div_head.cal_sdate.setFocus();
            break;
    }
}

//--------------------------------------------------------------------
// 변경 자료여부 저장여부 체크
//--------------------------------------------------------------------
this.ff_update_chk = function () {
    var vb_true = false;

    if (this.fvs_screen_mode == "L") return true;

    if (NXCore.isModified(this.ds_master)) {
        // MSG_TXT1 : 자료 입력중입니다. 계속 진행하면 현재자료는 없어집니다.	MSG_TXT2 : 계속 진행하시겠습니까?
        if (this.gf_message_chk("121934", "") == 1)
            vb_true = true;
        else
            vb_true = false;
    }
    else
        vb_true = true;

    return vb_true;
}

//--------------------------------------------------------------------
// 입력모드 선택시 처리
//--------------------------------------------------------------------
this.ff_input_mode = function (sMode) {
    if (!this.ff_update_chk()) return;	// 변경 자료여부 저장여부 체크

    this.fvs_input_mode = sMode;

    this.ds_master.clearData();
    this.ds_detail.clearData();

    if (sMode == 'I') {
        this.gf_mdi_btn_enable("etc1");
        this.gf_mdi_btn_disable("etc2");
    }
    else {
        this.gf_mdi_btn_enable("etc2");
        this.gf_mdi_btn_disable("etc1");
    }
}

//--------------------------------------------------------------------
// 사업장 선택시 
//--------------------------------------------------------------------
this.ff_company_saup_select = function () {
    this.fvs_companycode = this.div_head.div_company_select.cbo_companycode.value;
    this.fvs_saupcode = this.div_head.div_company_select.cbo_saupcode.value;

    this.ds_head.setColumn(this.ds_head.rowposition, "ARG_COMPCOD", this.fvs_companycode);
    this.ds_head.setColumn(this.ds_head.rowposition, "ARG_SAUPJCOD", this.fvs_saupcode);

    this.ds_master.clearData();
    this.ds_detail.clearData();
}

//
// Region End: 사용자 정의 함수
//
