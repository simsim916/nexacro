include "lib::common_form.xjs";
include "si_co::si_comm_function.xjs";

var v_itnbr = '';
var selectedGrid = 1;

this.form_onload = function (obj: Form, e: nexacro.LoadEventInfo) {
    this.gf_formOnload(obj);
    this.ff_load(obj);
}

this.ff_load = function (obj) {
    this.ff_Tran('SELECT_SETITEM');
}

// jsp 호출
this.ff_Tran = function (strSvcId) {
    switch (strSvcId) {
        case "SELECT_SETITEM":
            v_SvcAct = "01_moon/bi_item_itemset_e_1q.jsp";
            v_InDataset = "ds_para=ds_head";     // 반드시 기술할것
            v_OutDataset = "ds_item=output1";  // 반드시 output1으로 기술할것
            break;
        case "SAVE_MASTER":
            v_SvcAct = "01_moon/bi_item_itemset_e_1tr.jsp";
            v_InDataset = "input1=ds_item:U input2=ds_child:U";     // 반드시 기술할것
            v_OutDataset = "";  // 반드시 output1으로 기술할것
            break;
    }
    this.gf_Transaction_sync(strSvcId, v_SvcAct, v_InDataset, v_OutDataset, "ff_Callback");
}

this.ff_Callback = function (strSvcId, ErrorCode, ErrorMsg) {
    if (ErrorCode < 0) {
        NXCore.alert('CallBack SVCID = ' + strSvcId + '  ErrorCode = ' + ErrorCode + ' MSG = ' + ErrorMsg);
        return;
    }

    switch (strSvcId) {
        case "SELECT_SETITEM":
            if (this.ds_item.rowcount < 1) {
                this.gf_message_chk("110", ""); // 조회 및 출력할 자료가 없습니다.
            }
            this.grid_child.setCellProperty("body", 0, "edittype", "none");
            this.grid_child.setCellProperty("body", 1, "edittype", "none");
            this.grid_item.setCellProperty("body", 1, "edittype", "none");
            v_itnbr = this.ds_item.getColumn(this.ds_item.rowposition, "ITNBR");

            this.select_Child();
            break;
        case "SAVE_MASTER":
            this.alert("변경사항이 저장되었습니다.");
            break;
    }
}

// 닫기 버튼
this.btn_close_onclick = function () {
    if (NXCore.isModified(this.ds_item) || NXCore.isModified(this.ds_child)) {
        if (!this.gf_message_chk("1180", "")) {
            return;
        }
    }
    this.gf_closeMenu();
}
// 저장 버튼
this.btn_save_onclick = function () {
    if (confirm("현재 입력된 제품을 저장 하시겠습니까?") && this.insertCheck()) {
        this.ff_Tran("SAVE_MASTER");
    }
}
// 취소 버튼
this.btn_cancel_onclick = function () {
    if (NXCore.isModified(this.ds_item) || NXCore.isModified(this.ds_child)) {
        if (!this.gf_message_chk("1180", "")) {
            return;
        }
    }
    this.ff_Tran("SELECT_SETITEM");
}
// 삭제 버튼
this.btn_delete_onclick = function () {
    var row;

    if (selectedGrid == 1) {
        row = this.grid_item.getSelectedRows();
        this.ds_item.deleteRow(row);
    } else if (selectedGrid == 2) {
        row = this.grid_child.getSelectedRows();
        this.ds_child.deleteRow(row);
    }
}
// 추가 버튼
this.btn_add_onclick = function () {
    var row;

    if (selectedGrid == 1) {
        row = this.ds_item.addRow();
        this.ds_item.setColumn(row, "CRT_USER", application.getVariable("gvs_userid"));
        this.ds_item.setColumn(row, "CRT_DATE", this.gf_today());
        this.grid_item.setCellProperty("body", 1, "edittype", "text");
        this.gf_cursor_setting(this.grid_item, row, 'ITNBR');
    } else if (selectedGrid == 2) {
        row = this.ds_child.addRow();
        this.ds_child.setColumn(row, "ITNBR", v_itnbr);
        this.ds_child.setColumn(row, "CRT_USER", application.getVariable("gvs_userid"));
        this.ds_child.setColumn(row, "CRT_DATE", this.gf_today());
        this.grid_child.setCellProperty("body", 0, "edittype", "text");
        this.grid_child.setCellProperty("body", 1, "edittype", "text");
        this.gf_cursor_setting(this.grid_child, row, 'ITCLS_K');
    }
}
// 조회 버튼
this.btn_query_onclick = function () {
    this.ff_Tran("SELECT_SETITEM");
}
// 붙여넣기 버튼
this.btn_etc2_onclick = function () {
    this.ds_child.deleteAll();
    this.ds_child.copyData(this.ds_Temp);
}
// 복사 버튼
this.btn_etc1_onclick = function () {
    this.ds_Temp.deleteAll();
    this.ds_Temp.copyData(this.ds_child);
}

//형번 우클릭 시 검색 팝업
this.ff_Object_onrbuttondown = function (obj: Object, e: nexacro.MouseEventInfo) {
    trace('BB')
    var vs_Data = e.postvalue;

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

    if (obj.id == 'grid_item') {
        switch (this.gf_GetCellBind(obj, e.cell, 'Body')) {
            case 'ITNBR':
                this.ff_itemas_f_pop("co_pop_itemas_4_detail_item", vOpenParam);      // popup 을 띠움.
                break;
        }
    } else if (obj.id == 'grid_child') {
        switch (this.gf_GetCellBind(obj, e.cell, 'Body')) {
            case 'CINBR':
                this.ff_itemas_f_pop("co_pop_itemas_4_detail_child", vOpenParam);      // popup 을 띠움.
                break;
        }
    }
}

this.ff_itemas_f_pop = function (arg_svc, arg_para) {
    this.gf_showPopup(arg_svc, "co_popu::co_popu_itemas_f_4_ex.xfdl", { width: 907, height: 500 },
        {
            OpenRetv: 'Y',   // popup open 즉시 조회  
            MultSelect: 'Y',   // MULTI LINE 선택 (이 아규먼트는 POPUP 프로그램에서 ARG_PARA 의 8번째 방으로 대체 한다. 
            Argument: arg_para
        }, { modal: true, layered: true, autosize: false, callback: "ff_AfterPopup" });
}

// pupup의 콜백함수 처리
this.ff_AfterPopup = function (strId, obj) {
    var va_data = this.gf_popup_data(obj);  // popup 에서 넘어온 data 를 array 로 받아온다.
    var v_row;

    if (va_data == false) {
        alert("선택하신 자료가 없습니다. 다시 입력을 시도해주세요.")
        this.ds_item.deleteRow(row);
    }

    switch (strId) {
        case "co_pop_itemas_4_detail_item":
            this.ds_item.set_enableevent(false);
            for (var i = 0; i < va_data.length; i++) {
                if (va_data[i][10] != '0') {
                    alert(va_data[i][0] + " 사용할 수 없는 품번입니다.");
                    continue;
                }

                if (i > 0) {
                    v_row = this.ds_item.addRow();
                } else {
                    v_row = this.ds_item.rowposition;
                }
                this.ds_item.setColumn(v_row, "ITNBR", va_data[i][2]);
                this.ds_item.setColumn(v_row, "PRODNM", va_data[i][3]);
                this.ds_item.setColumn(v_row, "ITDSC", va_data[i][4]);
                this.ds_item.setColumn(v_row, "ISPEC", va_data[i][5]);
            }

            this.ds_item.set_enableevent(true);
            break;

        case "co_pop_itemas_4_detail_child":
            this.ds_child.set_enableevent(false);
            for (var i = 0; i < va_data.length; i++) {
                if (va_data[i][10] != '0') {
                    alert(va_data[i][0] + " 사용할 수 없는 품번입니다.");
                    continue;
                }

                if (i > 0) {
                    v_row = this.ds_child.addRow();
                } else {
                    v_row = this.ds_child.rowposition;
                }

                this.ds_child.setColumn(v_row, "ITNBR", v_itnbr);
                this.ds_child.setColumn(v_row, "CINBR", va_data[i][2]);
                this.ds_child.setColumn(v_row, "PRODNM", va_data[i][3]);
                this.ds_child.setColumn(v_row, "ITDSC", va_data[i][4]);
                this.ds_child.setColumn(v_row, "ISPEC", va_data[i][5]);
            }

            this.ds_child.set_enableevent(true);
            break;
    }
}

this.ff_Object_onitemchanged = function (obj: Dataset, e: nexacro.DSColChangeEventInfo) {
    trace('aa')
    var vs_Data;			//이벤트에서 데이터 값  
    var vn_Row; 			// 해당 row 값  
    // dataset과 다른 object로 나눠서 처리 
    // obj를 dataset를 확인 해서 처리 함.	
    if (obj == '[object Dataset]') {
        vn_Row = e.row;
        vs_Data = e.newvalue;
        if (obj.id == 'ds_item') {
            switch (e.columnid) {
                case 'ITNBR':
                    var vOpenSale = new Array();
                    vOpenSale[0] = 'ITEMAS';
                    vOpenSale[1] = vs_Data;
                    vOpenSale[2] = '1,7';  // 품목구분
                    vOpenSale[3] = 'Y';  // Y이면 검색시 POPUP을 자동으로 띄우고 N이면 POPUP을 안띄움
                    vOpenSale[4] = 'M';  // 선택기준 M:Multi, S:Single
                    vOpenSale[5] = '';

                    var vReturnSale = this.gfi_get_name_sale(vOpenSale);    // 찾지 못할경우에는 popup을 띠우기위한 array로 변환해온다. 

                    if (vReturnSale[99] == "POPUP") {
                        this.ff_itemas_f_pop("co_pop_itemas_4_detail_item", vReturnSale);      // popup 을 띠움. 
                        return;
                    }

                    this.ds_item.setColumn(vn_Row, "ITNBR", vReturnSale[1]);
                    this.ds_item.setColumn(vn_Row, "PRODNM", vReturnSale[2]);
                    this.ds_item.setColumn(vn_Row, "ITDSC", vReturnSale[3]);
                    this.ds_item.setColumn(vn_Row, "ISPEC", vReturnSale[4]);

                    break;
            }
        } else if (obj.id == 'ds_child') {
            switch (e.columnid) {
                case 'CINBR':
                    var vOpenSale = new Array();
                    vOpenSale[0] = 'ITEMAS';
                    vOpenSale[1] = vs_Data;
                    vOpenSale[2] = '1,7';  // 품목구분
                    vOpenSale[3] = 'Y';  // Y이면 검색시 POPUP을 자동으로 띄우고 N이면 POPUP을 안띄움
                    vOpenSale[4] = 'M';  // 선택기준 M:Multi, S:Single
                    vOpenSale[5] = '';

                    var vReturnSale = this.gfi_get_name_sale(vOpenSale);    // 찾지 못할경우에는 popup을 띠우기위한 array로 변환해온다. 

                    if (vReturnSale[99] == "POPUP") {
                        this.ff_itemas_f_pop("co_pop_itemas_4_detail_child", vReturnSale);      // popup 을 띠움. 
                        return;
                    }

                    this.ds_child.setColumn(vn_Row, "CINBR", vReturnSale[1]);
                    this.ds_child.setColumn(vn_Row, "PRODNM", vReturnSale[2]);
                    this.ds_child.setColumn(vn_Row, "ITDSC", vReturnSale[3]);
                    this.ds_child.setColumn(vn_Row, "ISPEC", vReturnSale[4]);

                    break;
            }
        } else if (obj.id == 'ds_head') {

            var vOpenSale = new Array();
            vOpenSale[0] = 'ITEMAS';
            vOpenSale[1] = vs_Data;
            vOpenSale[2] = '1,7';  // 품목구분
            vOpenSale[3] = 'Y';  // Y이면 검색시 POPUP을 자동으로 띄우고 N이면 POPUP을 안띄움
            vOpenSale[4] = 'M';  // 선택기준 M:Multi, S:Single
            vOpenSale[5] = '';

            var vReturnSale = this.gfi_get_name_sale(vOpenSale);    // 찾지 못할경우에는 popup을 띠우기위한 array로 변환해온다. 

            if (vReturnSale[99] == "POPUP") {
                this.ff_itemas_f_pop("co_pop_itemas_4_detail_child", vReturnSale);      // popup 을 띠움. 
                return;
            }

            this.ds_head.setColumn(vn_Row, "ITNBR", vReturnSale[1]);

            break;
        }
    }
}

this.grid_item_oncellclick = function (obj: Grid, e: nexacro.GridClickEventInfo) {
    this.selectGrid(obj);
    if (NXCore.isModified(this.ds_child)) {
        if (!confirm("해당 등록 제품으로 이동하면 매치 제품에 대한 변경사항이 사라집니다. 이동하시겠습니까?")) {
            return;
        }
    }
    v_itnbr = this.ds_item.getColumn(this.ds_item.rowposition, "ITNBR");
    this.select_Child();
}

this.selectGrid = function (obj: Grid, e: nexacro.GridClickEventInfo) {
    if (obj.id == "grid_item") {
        selectedGrid = 1;
    } else if (obj.id == "grid_child") {
        selectedGrid = 2;
    }
}

this.select_Child = function () {
    var sql = " SELECT A.CINBR, B.ITDSC, B.ISPEC, B.PRODNM, A.ITCLS_K, A.ITNBR, A.CRT_USER, A.CRT_DATE "
        + " FROM ITEMAS_SET A, ITEMAS B "
        + " WHERE A.CINBR = B.ITNBR(+) "
        + "	    AND A.ITNBR = '" + v_itnbr + "' "
        + "	    AND A.ITCLS_K <> 0 "
    this.gf_SelectSql_sync("ds_child:" + sql, "SELECT_CHILD", null, 0);
}

this.insertCheck = function (obj) {
    var ds_item = this.ds_item;
    var ds_child = this.ds_child;

    // 중복 품번 확인
    for (var i = 0; i < ds_item.getRowCount(); i++) {
        if (ds_item.getRowType(i) == 2) {
            for (var j = 0; j < ds_item.getRowCount(); j++) {
                if (ds_item.getColumn(j, "ITNBR") == ds_item.getColumn(i, "ITNBR") && j != i) {
                    alert("동일한 제품이 이미 등록되어 있습니다. 확인 후 다시 등록 해주세요");
                    return false;
                }
            }
        }
    }
    // 중복 품번 확인
    for (var i = 0; i < ds_child.getRowCount(); i++) {
        if (ds_child.getRowType(i) == 2) {
            for (var j = 0; j < ds_child.getRowCount(); j++) {
                if (ds_child.getColumn(j, "CINBR") == ds_child.getColumn(i, "CINBR") && j != i) {
                    alert("동일한 제품이 이미 등록되어 있습니다. 확인 후 다시 등록 해주세요");
                    return false;
                }
            }
        }
    }
    return true;
}



