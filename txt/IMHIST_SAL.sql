   host_jego_qty    NUMBER(14, 3);  --- 현재고
   host_prod_qty    NUMBER(14, 3);  --- 생산입고대기
   host_pob_qc_qty  NUMBER(14, 3);  --- 구매검사대기수량
   host_ins_qty     NUMBER(14, 3);  --- 구매입고대기수량
   host_inqty       NUMBER(14, 3);  --- 외주입고수량
   host_ouqty       NUMBER(14, 3);  --- 외주출고수량

if data_check = 'U' OR data_check = 'D' then

     SELECT A.IOSP,         -- I/O 구분
          A.STKVALUE,       -- 재고 연산값
          A.CALVALUE,       -- 수불 연산값
          A.TYPGBN,         -- 전표 유형
          A.ACTIOSP,        -- ??? (B에 있는 데이터 인데...?)
          B.IOCHOICE,       -- 5길이 문자인데 뭔지 모르겠음
          A.OUTGBN,         -- 수불구분
          nvl(A.WISTKVALUE, 0)
     INTO host_iosp,     
          host_stkvalue,
          host_calvalue, 
          host_typgbn,
          host_actiosp,
          host_iochoice,
          host_outgbn,
          host_outstk
     FROM IOMATRIX A,     -- 수불 코드와 재고 변경 내용을 저장하는 테이블
        IOMATRIX_V B      -- 수불 코드랑 나머지 내용들...?
     WHERE A.IOGBN = B.IOGBN
          AND A.IOGBN = old_iogbn;

     -- 
     if old_idate is not null then -- 수불 승인 일자가 있으면
          host_jego_qty := old_ioqty * host_stkvalue;   -- 현재고 = 재고수량은 수불 수량 x 재고 연산 값
     end if;