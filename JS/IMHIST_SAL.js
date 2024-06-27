

this.btn_etc1_onclick = function (obj: Button, e: nexacro.ClickEventInfo) {
    var vs_today = this.gf_today();
    trace("승인버튼");
    for (var i = 0; i < this.ds_master.rowcount; i++) {
        if (this.ds_master.getColumn(i, "CHK") == '0')
            continue;

        if (this.ds_master.getColumn(i, "JNPCRT") == '057') {
            var vs_sql =
                "SELECT * FROM IMHIST_SAL WHERE IOJPNO = '" + this.ds_master.getColumn(i, "IOJPNO") + "'";
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

            vn_jpno = this.ds_imhist.getMax("IOJPNO");
            this.ds_imhist.setColumn(vn_inrow, "IOJPNO", parseInt(vs_buljpno) + 2);
            this.ds_imhist.setColumn(vn_inrow, "IOGBN", "I11");
            this.ds_imhist.setColumn(vn_inrow, "DEPOT_NO", "Z10110"); // 불량창고 코드
            this.ds_imhist.setColumn(vn_inrow, "CVCOD", this.ds_temp.getColumn(0, "DEPOT_NO"));
            this.ds_imhist.setColumn(vn_inrow, "INPCNF", "I");
        }










        this.ds_master.setColumn(i, "IO_CONFIRM", "Y");
        this.ds_master.setColumn(i, "IO_DATE", vs_today);
        this.ds_master.setColumn(i, "IO_EMPNO", application.gvs_empid);
    }

    this.ff_Tran("SAVE_MASTER");
}