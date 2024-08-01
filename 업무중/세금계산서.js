/***********************************************************************
 * 01. Creation date      : 2015.09.03
 * 02. Created by         : 배석의
 * 03. Revision history   : 
 ***********************************************************************
 */
 
 include "lib::common_form.xjs";
 include "si_co::si_comm_function.xjs";
 include "fa_co::fa_comm_function.xjs";
include "fa_co::str_custom.xjs";
include "fa_co::str_jpra.xjs";
include "fa_co::str_account.xjs";

//--------------------------------------------------------------------
//// 인스턴스 변수 선언 부분
//--------------------------------------------------------------------
var vToday;

var iv_SvcAct, fvs_Mode;
this.fvs_autosungin;
this.fvs_companycode = "";
this.fvs_saupcode = "";
this.deptYn = "N";
this.adminYn = "N";
this.yesanYn = "N";
this.teamYn = "N";
this.junYn = 'N';
this.first_select = 0;
this.fvs_popup = "";


this.form_onload = function (obj: Form, e: nexacro.LoadEventInfo) {
    this.gf_formOnload(obj);
    this.ff_load(obj);
}
this.ff_load = function (obj) {

    this.ds_Head.addRow();

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

    this.ff_form_init();

}

// 초기값 설정
this.ff_form_init = function () {
    var vRow, vYyyy;

    vToday = this.gf_today();
    fvs_Mode = 'N';

    this.div_Input_Mode.Div00.btn_Input.set_text(this.gf_get_trans_word('전송\n대기'));
    this.div_Input_Mode.Div00.btn_Modify.set_text(this.gf_get_trans_word('전송\n완료'));

    this.gf_combo_head_sync(this.ds_Head, "ARG_SAUPJ", this.div_Head.cbo_Saupj, "co_dddw_reffpf_f_ad1", "", 0);
    this.gf_combo_head_sync(this.ds_Head, "ARG_GUBUN", this.div_Head.cbo_Gubun, "co_dddw_reffpf_f_5f", "", 0);
    if (NXCore.isEmpty(ivInqsarea) || ivInqsarea == '') {
        ivInqsarea = '%';
    }
    this.gf_combo_head_sync(this.ds_Head, "ARG_SAREA", this.div_Head.cbo_sarea, "co_dddw_sarea_sales", ivInqsarea + '|' + ivInqsarea2, 0);

    // TYPE1(01:세금계산서,02:수정세금계산서), TYPE2(01:일반,02:영세율), MODY_CODE(01:기재사항의 착오·정정,02:공급가액 변동..)
    this.gf_combo_grd_sync(this.grd_Detail, "BILL_TYPE", "co_dddw_reffpf_f_za", "", 0);
    this.gf_combo_grd_sync(this.grd_Detail, "BILL_CLASS", "co_dddw_reffpf_f_zb", "", 0);
    this.gf_combo_grd_sync(this.grd_Detail, "BILL_MODCD", "co_dddw_reffpf_f_zc", "", 0);
    this.gf_combo_grd_sync(this.grd_Detail, "VNDMST_GUBUN", "01^사업자@02^개인@03^외국인@99^기타", "", 0);

    this.ds_Head.setColumn(0, "ARG_FRDATE", vToday.substr(0, 6) + '01');
    this.ds_Head.setColumn(0, "ARG_TODATE", vToday);
    this.ds_Head.setColumn(0, "ARG_SAUPJ", application.gvs_defsaupj);
    this.ds_Head.setColumn(0, "ARG_GUBUN", '1');
    if (NXCore.isEmpty(ivInqsarea.replace(/%/gi, '')) || ivInqsarea.replace(/%/gi, '') == '') {
        this.ds_Head.setColumn(0, "ARG_SAREA", '%');
    }
    else {
        this.ds_Head.setColumn(0, "ARG_SAREA", ivInqsarea.replace(/%/gi, ''));
    }

    this.div_Head.cal_Sdatef.setFocus();


    this.ff_input_mode('I');

}

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

// 조회버튼
this.btn_query_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vs_Datef = this.ds_Head.getColumn(0, "ARG_FRDATE");
    var vs_Datet = this.ds_Head.getColumn(0, "ARG_TODATE");
    var vs_Saupj = this.ds_Head.getColumn(0, "ARG_SAUPJ");

    if (NXCore.isEmpty(vs_Datef) || vs_Datef == '') {
        this.gf_message_chk("200", this.gf_get_trans_word("매출기간 일자"));  //매출기간 일자
        this.ds_Head.setColumn(0, "ARG_FRDATE", '');
        return -1;
    }

    if (NXCore.isEmpty(vs_Datet) || vs_Datet == '') {
        this.gf_message_chk("200", this.gf_get_trans_word("매출기간 일자"));  //매출기간 일자
        this.ds_Head.setColumn(0, "ARG_TODATE", '');
        return -1;
    }

    if (NXCore.isEmpty(vs_Saupj) || vs_Saupj == '') {
        this.gf_message_chk("200", this.gf_get_trans_word("사업장"));  //사업장
        this.ds_Head.setColumn(0, "ARG_SAUPJ", '');
        return -1;
    }

    this.ff_Tran("SELECT");
}

// 취소 버튼
this.btn_cancel_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    this.ds_Detail.clearData();

    this.div_Head.cal_Sdatef.setFocus();

    return;
}

// 추가 버튼
this.btn_add_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {

}

// 삽입 버튼
this.btn_insert_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {

}

//엑셀변환버튼
this.btn_excel_chg_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    this.gf_excel_download(this.grd_Detail);
}

// 닫기 버튼
this.btn_close_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    //	this.parent.parent.parent_close();
    this.gf_closeMenu();
}


// 저장버튼
this.btn_save_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    // TRIGGER INVALID CHECK
    var vResult = this.gf_SelectSql_sync("ds_Temp: SELECT SUM(DECODE(STATUS, 'VALID', 0, 1)) FROM DBA_OBJECTS WHERE OBJECT_NAME LIKE 'TRI_SALEH%' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

    if (vResult[1] != '0') {

        var vSql;

        var vArgs = '';

        this.gf_Procedure_sync("PKG_SALE_040", vArgs, "PROCEDURE", "ff_Callback_sync", 0);

        // TRIGGER INVALID CHECK
        var vResult = this.gf_SelectSql_sync("ds_Temp: SELECT SUM(DECODE(STATUS, 'VALID', 0, 1)) FROM DBA_OBJECTS WHERE OBJECT_NAME LIKE 'TRI_SALEH%' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

        if (vResult[1] != '0') {
            alert("전자 세금계산서 전송 Trigger에서 Invalid가 발생된것이 있습니다..\n컴파일이 자동으로 되니 다시한번 시도하시기 바랍니다.");
            return;
        }
    }

    if (input_Mode == 'I') {
        if (this.gf_message_chk("121338", '') != '1') return;  //세금계산서 전송작업을 하시겠습니까?\n전송된 이후 계산서는 취소가 안됩니다..\nCheck가 안되어 있으면 정보만 저장됩니다.

        var nRet;

        nRet = this.ff_Savertn(this.ds_Detail);

        if (nRet == -1) {
            alert("작업이 실패하였습니다");
            return;
        }

        this.gf_message_chk("102594", ''); // 자료처리를 완료하였습니다.
    }
    else {
        var vs_Chkcnt = this.ds_Detail.findRowExpr("RESEND == '1' ", 0, this.ds_Detail.rowcount);
        if (vs_Chkcnt >= 0) {
            if (this.gf_message_chk("121339", '') != '1') return;  //E-mail 재전송작업을 하시겠습니까?

            var nRet;

            nRet = this.ff_Savertn_resend(this.ds_Detail);
            if (nRet == -1) {
                alert("작업이 실패하였습니다");
                return;
            }

            this.gf_message_chk("102594", ''); // 자료처리를 완료하였습니다.

        }
        else {
            alert("전자세금계산서 재전송할 내역이 없습니다");
            return;
        }
    }

    this.div_Head.cal_Sdatef.setFocus();

    return;

}

// 계산서 발행
this.btn_etc1_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vs_Row = this.ds_Detail.rowposition;
    if (vs_Row < 0) return;

    var vs_Jpno = this.ds_Detail.getColumn(vs_Row, "ISSU_ID");

    //	window.open("http://devweb.taxbill365.com/jsp/corp/comm/comm_0001_01.jsp?ISSU_ID="+vs_Jpno, "newNeoform", "scrollbars=1,resizable=yes,width=900, Height=800");

    // 	// 실 서버
    // 	system.execBrowser("http://home.taxbill365.com/jsp/corp/comm/comm_0001_01.jsp?ISSU_ID="+vs_Jpno, "newNeoform", "scrollbars=1,resizable=yes,width=900, Height=800");
    // 테스트 서버
    system.execBrowser("http://devweb.taxbill365.com/jsp/corp/comm/comm_0001_01.jsp?ISSU_ID=" + vs_Jpno, "newNeoform", "scrollbars=1,resizable=yes,width=900, Height=800");

}


/***********************************************************************
 * event function processing
 ************************************************************************/
//아이템 변경전
// this.ff_Object_onitemchanging = function(obj:Dataset, e:nexacro.DSRowPosChangeEventInfo)
// {
// 	var vs_Data;			//이벤트에서 데이터 값  
// 	var vs_Value;
// 	
// 	if(obj == '[object Dataset]'){
// 		vs_Data = e.newvalue;
// 		if(obj.id == 'ds_Detail') {
// 			switch (e.columnid){
// 				case 'ITNBR':
// 					if(NXCore.isEmpty(vs_Data)) return false;
// 					var vs_FindRow = this.ds_Detail.findRow("ITNBR",vs_Data);
// 					
// 					if (vs_FindRow >= 0) {
// 						this.gf_message_chk("800", "중복");  //alert("중복된 데이타입니다.");
// 						return false;
// 					}
// 			}
// 		}
// 	}
// 	
// 	return true;
// }


//아이템 변경시
this.ff_Object_onitemchanged = function (obj: Edit, e: nexacro.ChangeEventInfo) {
    var vs_Data;			//이벤트에서 데이터 값  
    var vs_Sql; 			//Sql의 값
    var vs_Row;

    if (obj == '[object Dataset]') {
        vs_Row = e.row;
        vs_Data = e.newvalue;

        if (obj.id == 'ds_Detail') {
            switch (e.columnid) {
                case 'CHK':
                    if (input_Mode == 'I') {
                        // 더존발행분 및 역발행업체는 전송안돠게 함
                        var vDescr = this.ds_Detail.getColumn(vs_Row, "DESCR");
                        var vTax_rtpgu = this.ds_Detail.getColumn(vs_Row, "TAX_RTPGU");
                        var vSano = this.ds_Detail.getColumn(vs_Row, "SANO");
                        var vGubun = this.ds_Detail.getColumn(vs_Row, "VNDMST_GUBUN");
                        var vResident = this.ds_Detail.getColumn(vs_Row, "RESIDENT");

                        if (vGubun != '01' && vGubun != '02') {
                            alert("개인 또는 사업자만 전송 가능합니다..");
                            this.ds_Detail.setColumn(vs_Row, 'CHK', '0');

                            return;
                        }

                        if (this.ds_Detail.getColumn(vs_Row, "GONAMT") == 0) {
                            alert("공급가액이 0원입니다..확인바랍니다...");
                            this.ds_Detail.setColumn(vs_Row, 'CHK', '0');
                            return;
                        }

                        if (vGubun == '01') {
                            if (vSano == '0000000000' || vSano.length != 10) {
                                alert("사업장 번호가 불안정 합니다..확인바랍니다..");
                                this.ds_Detail.setColumn(vs_Row, 'CHK', '0');
                                return;
                            }
                        }

                        if (vGubun == '02') {
                            if (vResident.length != 13) {
                                alert("주민 번호가 불안정 합니다..확인바랍니다..");
                                this.ds_Detail.setColumn(vs_Row, 'CHK', '0');
                                return;
                            }
                        }

                        if (vTax_rtpgu == 'Y') {
                            alert("역발행 업체는 선택할 수 없습니다");
                            this.ds_Detail.setColumn(vs_Row, 'CHK', '0');
                            return;
                        }

                        if (vDescr == '더존발행분') {
                            alert("이미 더존에서 발행된 분이므로 중복전송을 할 수 없습니다.");
                            this.ds_Detail.setColumn(vs_Row, 'CHK', '0');
                            return;
                        }

                        var vSaledt = this.ds_Detail.getColumn(vs_Row, "SALEDT");

                        if (vs_Data == '1') {
                            // 처리구분(Y:전송완료,N:미완료)
                            this.ds_Detail.setColumn(vs_Row, 'TAXBILL', 'Y');


                        }
                        else {
                            // 처리구분(Y:전송완료,N:미완료)
                            this.ds_Detail.setColumn(vs_Row, 'TAXBILL', 'N');

                        }

                    }
                    else {
                        if (vs_Data == '1') {
                            // 처리구분(Y:전송완료,N:미완료)
                            this.ds_Detail.setColumn(vs_Row, "TAXBILL", 'N');


                        }
                        else {
                            // 처리구분(Y:전송완료,N:미완료)
                            this.ds_Detail.setColumn(vs_Row, "TAXBILL", 'Y');

                        }
                    }

                    break;

                case 'DTLCHK':
                    alert('개발필요');
                    break;

                case 'ACCGU':
                    alert('개발필요');
                    break;

                case 'SUJUNG':
                    if (vs_Data == '1') {
                        this.ds_Detail.setColumn(vs_Row, "CHK", '0');
                    }
                    break;

                case 'RECOVER_CODE':
                    if (vs_Data == '1') {
                        if (application.confirm("전송취소를 하시겠습니까?") == false) {
                            this.ds_Detail.setColumn(vs_Row, "RECOVER_CODE", '0');

                            return;
                        }
                        else {
                            var vSaledt = this.ds_Detail.getColumn(vs_Row, "SALEDT");
                            var vSaleno = this.ds_Detail.getColumn(vs_Row, "SALENO");
                            // 계산서 Table을 검색하여 상태코드가 '99'가 아니면 취소못하게 함, ERR_CD가 000000 이 아닌 경우도 취소 할 수 있슴
                            var vResult = this.gf_SelectSql_sync("ds_Temp: SELECT STAT_CODE, DECODE(ERR_CD, NULL, '', '', '', '000000', '성공',  '실패') FROM ERPTAX.ITIS_ISSU_MSTR WHERE ISSU_SEQNO = '" + vSaledt + "'||'" + vSaleno + "' ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

                            if (vResult[1] == '99' || vResult[2] == '실패') {
                                var vSql = "UPDATE SALEH SET TAXBILL = 'N' WHERE SALEDT = '" + vSaledt + "' AND SALENO = " + vSaleno + " ";

                                this.gf_UpdateSql_sync(vSql, 'UPDATE_SQL', "ff_Callback_sync", 0);

                                this.btn_query_onclick();

                            }
                            else {
                                alert("이 자료는 진행중이거나 정상종료된 자료입니다");
                                this.ds_Detail.setColumn(vs_Row, "RECOVER_CODE", '0');
                                return;
                            }
                        }
                    }

                    break;
            }
        }
    }
    else {
        //사업장 변경시 창고DDDW 변경
        vs_Data = e.postvalue;
        var vs_Depot_No, vs_Saupj, vs_Arg_1, vs_value;

        if (obj.parent.name == 'div_Head') {
            switch (obj.name) {

                case 'cal_Sdatef':
                case 'cal_Sdatet':
                    if (!NXCore.isEmpty(vs_Data)) {
                        if (this.gf_datecheck(vs_Data) != 1) {
                            this.gf_message_chk("102344", ""); // 일자가 형식에 맞지 않습니다. 일자를 확인하십시오.
                            return;
                        }
                    }
                    break;


                case 'edt_Scvcod':

                    if (NXCore.isEmpty(vs_Data) || vs_Data == '') {
                        this.ds_Head.setColumn(0, 'ARG_CVCOD', '');
                        this.ds_Head.setColumn(0, 'ARG_CVNAS', '');
                        return;
                    }

                    var vOpenSale = new Array();
                    vOpenSale[0] = 'VNDMST';
                    vOpenSale[1] = vs_Data;
                    vOpenSale[2] = '';
                    vOpenSale[3] = '1';

                    var vReturnSale = this.gfi_get_name_sale(vOpenSale);

                    if (vReturnSale[1] == 'NOT EXISTS') {
                        alert("거래처가 없거나 지금 현재 거래중인 고객이 아닙니다.");

                        this.ds_Head.setColumn(0, 'ARG_CVCOD', '');
                        this.ds_Head.setColumn(0, 'ARG_CVNAS', '');
                        return;
                    }
                    else {
                        this.ds_Head.setColumn(0, 'ARG_CVCOD', vReturnSale[1]);
                        this.ds_Head.setColumn(0, 'ARG_CVNAS', vReturnSale[2]);
                    }


                    break;

                case 'ed_damdang':

                    if (NXCore.isEmpty(vs_Data) || vs_Data == '') {
                        this.ds_Head.setColumn(0, 'ARG_DAMDANG', '');
                        this.ds_Head.setColumn(0, 'ARG_EMPNAME', '');
                        return;
                    }

                    var vOpenSale = new Array();
                    vOpenSale[0] = 'SAWON';
                    vOpenSale[1] = vs_Data;

                    var vReturnSale = this.gfi_get_name_sale(vOpenSale);

                    if (vReturnSale[1] == 'NOT EXISTS' || vReturnSale[5] != '1') {
                        alert("사원번호가 존재하지 않거나 현 재직자가 아닙니다.");

                        this.ds_Head.setColumn(0, 'ARG_DAMDANG', '');
                        this.ds_Head.setColumn(0, 'ARG_EMPNAME', '');
                        return;
                    }
                    else {
                        this.ds_Head.setColumn(0, 'ARG_DAMDANG', vReturnSale[1]);
                        this.ds_Head.setColumn(0, 'ARG_EMPNAME', vReturnSale[2]);
                        return;
                    }
                    break;
            }
        }

    }
}

//마우스 우측버튼 클릭시
this.ff_Object_onrbuttondown = function (obj: Edit, e: nexacro.MouseEventInfo) {
    var vs_Data = e.postvalue;
    var vs_Arg = '';

    if (obj.readonly) return;		//readonly 상태 이면 팝업 취소 

    if (obj == '[object Grid]') {
        if (obj.id == 'grd_Detail') {
            switch (this.gf_GetCellBind(obj, e.cell, 'Body')) {


            }
        }
    }
    else {
        if (obj.parent.name == 'div_Head') {
            switch (obj.name) {
                case 'edt_Scvcod':

                    var vOpenParam = new Array();
                    vOpenParam[0] = null;
                    vOpenParam[1] = vs_Data;
                    vOpenParam[3] = null;
                    vOpenParam[4] = null;
                    //vOpenParam[5] = vData;
                    this.ff_co_popu_vndsale_f("popup_ed_con_cvcod_head", vOpenParam);

                    break;

                case 'ed_damdang':

                    this.ff_co_popu_sawon_sale_f("popup_ed_sales_empno_head", '' + '|' + '' + '|' + vs_Data);

                    break;

            }
        }
    }
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

// pupup의 콜백함수 처리
this.ff_AfterPopup = function (strId, obj) {
    var va_Data = this.gf_popup_data(obj);  // popup 에서 넘어온 data 를 array 로 받아온다.

    if (va_Data == false) return;  // 자료 없음 

    switch (strId) {

        case "popup_ed_con_cvcod_head":
            for (var i = 0; i < va_Data.length; i++) {
                this.ds_Head.setColumn(0, 'ARG_CVCOD', va_Data[i][0]);
                this.ds_Head.setColumn(0, 'ARG_CVNAS', va_Data[i][2]);
            }
            break;

        case "popup_ed_sales_empno_head":
            for (var i = 0; i < va_Data.length; i++) {
                this.ds_Head.setColumn(0, 'ARG_DAMDANG', va_Data[i][0]);
                this.ds_Head.setColumn(0, 'ARG_EMPNAME', va_Data[i][1]);
            }
            break;

    }

    return;
}


/***********************************************************************
 * User created function processing
 ************************************************************************/
this.ff_Callback_sync = function (sSvcID, ErrorCode, ErrorMsg) {
    vi_ErrorCode = ErrorCode;     // 콜백루틴의 에러코드        싱크트란잭션일경우 사용
    vs_ErrorMsg = ErrorMsg;      //// 콜백루틴의 에러메세지    싱크트란잭션일경우 사용
    if (ErrorCode < 0) {
        NXCore.alert('CallBack SVCID = ' + sSvcID + '  ErrorCode = ' + ErrorCode + ' MSG = ' + ErrorMsg);
    }

}

// 콜백 함수 처리 
this.ff_Callback = function (sSvcID, ErrorCode, ErrorMsg) {
    vi_ErrorCode = ErrorCode;
    if (ErrorCode < 0) {
        NXCore.alert(ErrorMsg);
        return;
    }
    switch (sSvcID) {
        case "SELECT":
            this.ds_Detail.set_enableevent(true);
            if (this.ds_Detail.rowcount <= 0) {
                this.gf_message_chk("110", "");  //alert("자료가 존재하지 않습니다.");
                return;
            }
            break;
        case "SAVE_DETAIL":

            this.gf_message_chk("140", "");	// 정상적으로 저장되었습니다.		 

            this.btn_query_onclick();
            break;


    }
}

// 트란잭션 처리 
this.ff_Tran = function (strSvcId) {
    switch (strSvcId) {
        case "SELECT":
            this.ds_Detail.set_enableevent(false);


            if (NXCore.isEmpty(this.ds_Head.getColumn(0, "ARG_CVCOD"))) {
                this.ds_Head.setColumn(0, "ARG_CVCOD_P", "%");
            }
            else {
                this.ds_Head.setColumn(0, "ARG_CVCOD_P", this.ds_Head.getColumn(0, "ARG_CVCOD"));
            }


            if (NXCore.isEmpty(this.ds_Head.getColumn(0, "ARG_DAMDANG"))) {
                this.ds_Head.setColumn(0, "ARG_DAMDANG_P", "%");
            }
            else {
                this.ds_Head.setColumn(0, "ARG_DAMDANG_P", this.ds_Head.getColumn(0, "ARG_DAMDANG"));
            }

            this.ds_Head.setColumn(0, "ARG_TAXBILL", fvs_Mode);

            v_SvcAct = iv_SvcAct
            v_InDataset = "ds_para=ds_Head";     // 반드시 기술할것
            v_OutDataset = "ds_Detail=output1";  // 반드시 output1으로 기술할것
            v_Argument = "";
            break;

        case "SAVE_DETAIL":

            if (input_Mode == 'I') {

                v_SvcAct = "bill/sale/bill_sale_neopload_e_1tr.jsp";

            }
            else {


                v_SvcAct = "bill/sale/bill_sale_neopload_e_2tr.jsp";

            }

            v_InDataset = "input1=ds_Detail:U";       // 반드시 input1으로 기술할것
            v_OutDataset = "";
            break;


    }
    this.gf_Transaction_Async(strSvcId, v_SvcAct, v_InDataset, v_OutDataset, "ff_Callback");
}

this.ff_Savertn = function (vDw) {
    var nRowCnt = vDw.rowcount;

    for (i = 0; i <= nRowCnt - 1; i++) {
        vs_Chk = vDw.getColumn(i, "CHK");

        if (vs_Chk != '1') {
            continue;
        }

        var vCvcod = vDw.getColumn(i, "CVCOD");
        var vSaleCod = vDw.getColumn(i, "SALESCOD");
        var vSaledt = vDw.getColumn(i, "SALEDT");

        var nSaleno = vDw.getColumn(i, "SALENO");

        var vBill_nm = vDw.getColumn(i, "BILL_NM");    //// 공급받는자 담당자 정보...
        var vBill_dept = vDw.getColumn(i, "BILL_DEPT");
        var vBill_telno = vDw.getColumn(i, "BILL_TELNO");
        var vBill_hpno = vDw.getColumn(i, "BILL_HPNO");
        var vBill_email = vDw.getColumn(i, "BILL_EMAIL");

        var vBill_sanoyn = vDw.getColumn(i, "BILL_SANOYN");   /////공급자 정보
        var vBill_tongyn = vDw.getColumn(i, "BILL_TONGYN");



        var vBill_type = vDw.getColumn(i, "BILL_TYPE");   //// 세금계산서 종류
        var vBill_class = vDw.getColumn(i, "BILL_CLASS");  //// 세금계산서 분류
        var vBill_modcd = vDw.getColumn(i, "BILL_MODCD");  ////수정 세금계산서 수정사유코드

        var vGonamt = vDw.getColumn(i, "GONAMT");
        var vVatamt = vDw.getColumn(i, "VATAMT");

        if (NXCore.isEmpty(vBill_nm) || vBill_nm == '') {
            this.gf_message_chk("200", this.gf_get_trans_word("공급담당자"));  //공급담당자
            this.ds_Detail.setColumn(i, "BILL_NM", '');
            this.gf_cursor_setting(this.grd_Detail, i, "BILL_NM");
            return -1;
        }

        if (NXCore.isEmpty(vBill_email) || vBill_email == '') {
            this.gf_message_chk("200", this.gf_get_trans_word("공급받는자 E-MAIL"));  //공급받는자 E-MAIL
            this.ds_Detail.setColumn(i, "BILL_EMAIL", '');
            this.gf_cursor_setting(this.grd_Detail, i, "BILL_EMAIL");
            return -1;
        }

    }

    this.ff_Tran("SAVE_DETAIL");

}


this.ff_Savertn_resend = function (vDw) {
    var vIsql, vMaxno, vRsql, vSndcnt = 0;
    var vn_Rowcnt = vDw.rowcount;

    for (i = 0; i <= vn_Rowcnt - 1; i++) {
        vs_Chk = vDw.getColumn(i, "RESEND");

        if (vs_Chk != '1') {
            continue;
        }
        vSndcnt = vSndcnt + 1;
        this.ds_Head.setColumn(0, "ARG_RECNT", vSndcnt);
        var vRecnt = this.ds_Head.getColumn(0, "ARG_RECNT");
        this.div_Head.Static01.set_text('재전송중( ' + vRecnt + ' )');

        var vCvcod = vDw.getColumn(i, "CVCOD");
        var vSaleCod = vDw.getColumn(i, "SALESCOD");
        var vSaledt = vDw.getColumn(i, "SALEDT");

        var nSaleno = vDw.getColumn(i, "SALENO");

        var vBill_nm = vDw.getColumn(i, "BILL_NM");    //// 공급받는자 담당자 정보...
        var vBill_dept = vDw.getColumn(i, "BILL_DEPT");
        var vBill_telno = vDw.getColumn(i, "BILL_TELNO");
        var vBill_hpno = vDw.getColumn(i, "BILL_HPNO");
        var vBill_email = vDw.getColumn(i, "BILL_EMAIL");

        var vBill_sanoyn = vDw.getColumn(i, "BILL_SANOYN");   /////공급자 정보
        var vBill_tongyn = vDw.getColumn(i, "BILL_TONGYN");



        var vBill_type = vDw.getColumn(i, "BILL_TYPE");   //// 세금계산서 종류
        var vBill_class = vDw.getColumn(i, "BILL_CLASS");  //// 세금계산서 분류
        var vBill_modcd = vDw.getColumn(i, "BILL_MODCD");  ////수정 세금계산서 수정사유코드

        var vGonamt = vDw.getColumn(i, "GONAMT");
        var vVatamt = vDw.getColumn(i, "VATAMT");

        if (NXCore.isEmpty(vBill_nm) || vBill_nm == '') {
            this.gf_message_chk("200", this.gf_get_trans_word("공급담당자"));  //공급담당자
            this.ds_Detail.setColumn(i, "BILL_NM", '');
            this.gf_cursor_setting(this.grd_Detail, i, "BILL_NM");
            return -1;
        }

        if (NXCore.isEmpty(vBill_email) || vBill_email == '') {
            this.gf_message_chk("200", this.gf_get_trans_word("공급받는자 E-MAIL"));  //공급받는자 E-MAIL
            this.ds_Detail.setColumn(i, "BILL_EMAIL", '');
            this.gf_cursor_setting(this.grd_Detail, i, "BILL_EMAIL");
            return -1;
        }

        vs_Rsql = this.gf_SelectSql_sync("ds_Temp: SELECT NVL(MAX(SEQNO), 0) FROM SALEH_EMAIL WHERE SALEDT = '" + vSaledt + "' AND SALENO = " + nSaleno + " ", "SELECT_reffpf_5A", "ff_Callback_sync", 0);

        if (NXCore.isEmpty(vs_Rsql) || vRsql == '') {
            if (vs_Rsql[1] != 0) {
                vMaxno = parseInt(vs_Rsql[1]) + 1;
            }
            else {
                vMaxno = 1;
            }
        }
        else {

            vMaxno = parseInt(vs_Rsql[1]) + 1;
        }

        vs_Lsql = "INSERT INTO SALEH_EMAIL VALUES ('" + vSaledt + "', " + nSaleno + ", " + vMaxno + ", '" + vBill_nm + "', '" + vBill_email + "' ) ";

        this.gf_UpdateSql_sync(vs_Lsql, 'UPDATE_SQL', "ff_Callback_sync", 0);
    }

    this.ds_Head.setColumn(0, "ARG_RECNT", 0);

    this.btn_query_onclick();
}

// 입력모드 선택시 처리
this.ff_input_mode = function (sMode) {
    input_Mode = sMode;

    this.ds_Detail.clearData();

    // 매출구분(1:내수,3:LOCAL)
    var vs_Gubun = this.ds_Head.getColumn(0, "ARG_GUBUN");

    if (input_Mode == 'I') {
        fvs_Mode = 'N';
        this.parent.parent.div_btnList.ButtonInfo = "etc1";
        this.parent.parent.div_btnList.ff_disable_button();

        iv_SvcAct = "bill/sale/bill_sale_neopload_e_1q.jsp";

        this.grd_Detail.setFormat("input_1");
        this.div_Head.Static00.set_text('전송할 내역을 조회중입니다.');
        this.div_Head.Static01.set_visible(false);
    }
    else {
        fvs_Mode = 'Y';
        this.parent.parent.div_btnList.ButtonInfo = "etc1";
        this.parent.parent.div_btnList.ff_enable_button();

        iv_SvcAct = "bill/sale/bill_sale_neopload_e_2q.jsp";

        this.grd_Detail.setFormat("input_2");
        this.div_Head.Static00.set_text('전송된 내역을 조회중..재전송만 가능합니다.');
        this.div_Head.Static01.set_visible(true);
    }

    // 	this.gf_combo_grd_sync(this.grd_Detail,"BILL_TYPE","co_dddw_reffpf_f_za","",0);
    // 	this.gf_combo_grd_sync(this.grd_Detail,"BILL_CLASS","co_dddw_reffpf_f_zb","",0);

    // TYPE1(01:세금계산서,02:수정세금계산서), TYPE2(01:일반,02:영세율)
    this.gf_combo_grd_sync(this.grd_Detail, "BILL_TYPE", "co_dddw_reffpf_f_za", "", 0);
    this.gf_combo_grd_sync(this.grd_Detail, "BILL_CLASS", "co_dddw_reffpf_f_zb", "", 0);
    this.gf_combo_grd_sync(this.grd_Detail, "BILL_MODCD", "co_dddw_reffpf_f_zc", "", 0);
    this.gf_combo_grd_sync(this.grd_Detail, "VNDMST_GUBUN", "01^사업자@02^개인@03^외국인@99^기타", "", 0);
}

this.grd_Detail_oncellclick = function (obj: Grid, e: nexacro.GridClickEventInfo) {
    var vData = e.newvalue;
    var vName = this.gf_GetCellBind(obj, e.cell, 'Body');
    var vDw = this.ds_Detail;
    var vRow = this.ds_Detail.rowposition;


    switch (vName) {
        case "DTLCHK":

            var resultForm = this.gf_showPopup("popup_object_detail", "co_popu::co_popu_magam_cnf2_f.xfdl", { width: 10, height: 20 },
                {
                    OpenRetv: 'Y',   // popup open 즉시 조회  
                    MultSelect: 'N',   // MULTI LINE 선택
                    Argument: vDw.getColumn(vRow, "SALEDT") + '|' + vDw.getColumn(vRow, "SALENO")  // 조회조건 파라메터 
                }, { callback: "ff_AfterPopup" });


            break;

        case "ACCGU":
            if (vDw.getRowLevel(vDw.rowposition) != 0) return;

            this.str_jpra.companycode = '01';

            this.str_jpra.saupjang = this.ds_Head.getColumn(0, "ARG_SAUPJ");
            var vs_baldate = vDw.getColumn(vDw.rowposition, "ACC_BAL_DATE");
            vs_baldate = this.gf_Replace(vs_baldate, '\\.', '');
            this.str_jpra.baldate = vs_baldate;

            this.str_jpra.bjunno = vDw.getColumn(vDw.rowposition, "ACC_BJUN_NO");
            this.str_jpra.upmugu = vDw.getColumn(vDw.rowposition, "ACC_UPMU_GU");

            var vSql = "select  bal_date, bjun_no, jun_gu, dept_cd, sawon,alc_gu ,lin_no ";
            vSql += "  FROM erpacc.kfz12ot0  	  ";
            vSql += " WHERE  ";
            vSql += "    saupj = '" + this.ds_Head.getColumn(0, "ARG_SAUPJ") + "' ";
            vSql += "   and bal_date = '" + vs_baldate + "' ";
            vSql += "   and upmu_gu = '" + this.str_jpra.upmugu + "' ";
            vSql += "   and bjun_no = " + this.str_jpra.bjunno + " ";
            vSql = "ds_Temp : " + vSql;

            this.gf_SelectSql_sync(vSql, "kfz12ot0", "ff_Callback_sync", 0)
            if (vi_ErrorCode < 0) {
                return -1;
            }

            if (this.ds_Temp.rowcount == 0) {

                //alert("kfz12ot0  가  없습니다")
                this.gf_message_chk("121592", "");
                return -1;
            }
            this.str_jpra.baldate = this.ds_Temp.getColumn(0, "BAL_DATE");
            this.str_jpra.bjunno = this.ds_Temp.getColumn(0, "BJUN_NO");
            this.str_jpra.jun_gu = this.ds_Temp.getColumn(0, "JUN_GU");
            this.str_jpra.dept = this.ds_Temp.getColumn(0, "DEPT_CD");
            this.str_jpra.sawon = this.ds_Temp.getColumn(0, "SAWON");
            this.str_jpra.alc_gu = this.ds_Temp.getColumn(0, "ALC_GU");
            this.str_jpra.sortno = this.ds_Temp.getColumn(0, "LIN_NO");

            // popup 의 써비스 아이디를 유니크 하게 만든다. popu_xxxx   로 시작하면서  현 프로그램 아이디로 만든다. 
            vs_win_id = this.getOwnerFrame().id;
            for (var idx = application.popupframes.length - 1; idx >= 0; idx--) {
                if (application.popupframes[idx].id == "popu_manualslip_mst" + vs_win_id)
                    application.popupframes[idx].form.ff_company_saup_select();
            }
            var resultForm = this.gf_showPopup("popu_manualslip_mst" + vs_win_id, "fa_acco::fa_acco_manualslip_mst_budg_e.xfdl", { width: 1024, height: 500 },
                {
                    OpenRetv: 'Y',   // popup open 즉시 조회  
                    MultSelect: 'N',   // MULTI LINE 선택
                    Argument: ""
                }, { modal: false, layered: true, showtitlebar: true, resizable: true, autosize: false, callback: "ff_AfterPopup" });

            break;

    }
}
