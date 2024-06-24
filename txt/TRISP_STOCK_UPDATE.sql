create or replace PROCEDURE        Trisp_Stock_Update
(     ar_depot_no        IN     VARCHAR2, -- 창고명
      ar_itnbr        IN     VARCHAR2,    -- 품명
      ar_pspec        IN     VARCHAR2,    -- 규격
    ar_jego_qty        IN    NUMBER,      -- 현재고 
    ar_hold_qty        IN    NUMBER,
    ar_valid_qty    IN    NUMBER,
    ar_order_qty    IN    NUMBER,
    ar_mfgcnf_qty    IN    NUMBER,
    ar_jisi_qty        IN    NUMBER,
    ar_prod_qty        IN    NUMBER,
    ar_balju_qty    IN    NUMBER,
    ar_pob_qc_qty    IN    NUMBER,
    ar_ins_qty        IN    NUMBER,
    ar_gi_qc_qty    IN    NUMBER,
    ar_gita_in_qty    IN    NUMBER,
    ar_status         IN  VARCHAR2,    /* Insert: I, Update: U, Delete D */
    ar_error        OUT VARCHAR2 )
AS
    host_depot    VARCHAR2(13);
--    host_pspec    varchar2(40);
    
BEGIN

--     host_pspec := '.';     

--    dbms_output.ENABLE(100000);
    /*******************************************************/
    /* 재고(STOCK) Update                                  */
    /* ar_status : 상태 ( Insert: I, Update: U, Delete D ) */
    /* Return    : ar_error ( Error여부 : Y/N )            */
    /*******************************************************/

    IF ar_status = 'I' OR ar_status = 'U' THEN
        /* 재고(STOCK) 존재 여부 check */
        BEGIN
            SELECT depot_no INTO host_depot FROM STOCK
             WHERE depot_no = ar_depot_no AND itnbr = ar_itnbr AND pspec = ar_pspec;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                INSERT INTO STOCK (depot_no, itnbr, pspec, jego_qty, hold_qty, valid_qty, order_qty,
                                    mfgcnf_qty, jisi_qty, prod_qty, balju_qty, pob_qc_qty, ins_qty,
                                    gi_qc_qty, gita_in_qty, locfr, locto,
                                    lastc, balju_cnvqty, stats)
                    VALUES(ar_depot_no, ar_itnbr, ar_pspec, 0,0,0,0,0,0,0,0,0,0,0,0,NULL,NULL,NULL,0, 'N');
        END;
    END IF;

    /* 재고(STOCK) 갱신 */
    UPDATE STOCK
       SET jego_qty     =  jego_qty     +     ar_jego_qty,
            hold_qty        =  hold_qty     +     ar_hold_qty,
           order_qty    =  order_qty    +   ar_order_qty,
--           mfgcnf_qty    =
           jisi_qty        =  jisi_qty        +     ar_jisi_qty,
           prod_qty        =  prod_qty     +     ar_prod_qty,
           balju_qty    =  balju_qty    +   ar_balju_qty,
           pob_qc_qty    =  pob_qc_qty   +    ar_pob_qc_qty,
           ins_qty        =  ins_qty        +    ar_ins_qty,
           gi_qc_qty    =  gi_qc_qty    +    ar_gi_qc_qty,
           gita_in_qty    =  gita_in_qty    +    ar_gita_in_qty
     WHERE depot_no  = ar_depot_no AND itnbr = ar_itnbr AND pspec = ar_pspec;

    ar_error := 'N' ;

EXCEPTION
    WHEN OTHERS THEN
        RAISE_APPLICATION_ERROR(-20010, 'STATUS:'||ar_status||',DEPOT:'||ar_depot_no||',ITNBR:'||ar_itnbr||SQLERRM );
        ar_error := 'Y' ;
END ;