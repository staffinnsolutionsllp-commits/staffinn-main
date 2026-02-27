using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
//using System.Linq;
using System.Text;
using System.Windows.Forms;

using System.Runtime.InteropServices;
using System.IO;

namespace SBXPCSampleCSharp
{
    public partial class frmLog : Form
    {
        public frmLog()
        {
            InitializeComponent();
        }

        AxSBXPCLib.AxSBXPC bpc;
        Object[] gstrLogItem;
        const int gMaxLow = 30000;
        bool glogSearched = false;
        int prevSelectLogIndex = -1;
        //Dim dt As New DataTable()
        DataTable dt = new DataTable();


        private void cmdGlogData_Click(object sender, EventArgs e)
        {
            glogSearched = true;

            int vTMachineNumber = 0;
            int vSMachineNumber = 0;
            int vSEnrollNumber = 0;
            //            int vInOutMode = 0;
            int vVerifyMode = 0;
            int vYear = 0;
            int vMonth = 0;
            int vDay = 0;
            int vHour = 0;
            int vMinute = 0;
            int vSecond = 0;
            Boolean vRet;
            int vErrorCode = 0;
            int i;
            int n;
            int vMaxLogCnt;
            int vAttStatus, vAntipass;
            string stAttStatus, stAntipass;
            int vDiv;

            vMaxLogCnt = gMaxLow;
            vDiv = 65536;

            lblMessage.Text = "Waiting...";
            LabelTotal.Text = "Total : ";
            Application.DoEvents();

            //    gridSLogData.Redraw = false;
            //    gridSLogData.Height = 298;
            //    gridSLogData.Clear();
            //    gridSLogData1.Top = gridSLogData.Top + gridSLogData.Height;
            //    gridSLogData1.Height = 0;
            //    gridSLogData1.Redraw = false;
            //    gridSLogData1.Clear();
            //    gridSLogData2.Top = gridSLogData.Top + gridSLogData.Height;
            //    gridSLogData2.Height = 0;
            //    gridSLogData2.Redraw = false;
            //    gridSLogData2.Clear();

            gstrLogItem = new Object[] { "SrNo", "PhotoNo", "EnrollNo", "EMachineNo", "VeriMode", "DateTime" };

            //    // gridSLogData
            //    gridSLogData.Row = 0;
            //    gridSLogData.Cols = 9;
            //    gridSLogData.set_ColWidth(0, 600);
            //    for (i = 1; i < 6; i++)
            //    {
            //        gridSLogData.Col = i;
            //        gridSLogData.Text = (string)gstrLogItem[i];
            //        gridSLogData.set_ColAlignment(i, 3);
            //        gridSLogData.set_ColWidth(i, 1200);
            //    }
            //    gridSLogData.set_ColWidth(4, 2000);
            //    gridSLogData.Col = 5;
            //    gridSLogData.set_ColWidth(5, 2000);
            //    gridSLogData.set_ColWidth(6, 700);
            //    gridSLogData.set_ColWidth(7, 700);
            //    gridSLogData.set_ColWidth(8, 700);
            //    n = gridSLogData.Rows;
            //    if (n > 2)
            //    {
            //        while (n != 2)
            //        {
            //            gridSLogData.RemoveItem((n));
            //            n = n - 1;
            //        }
            //    }
            //    gridSLogData.Redraw = true;

            //    // gridSLogData1
            //    gridSLogData1.Row = 0;
            //    gridSLogData1.Cols = 9;
            //    gridSLogData1.set_ColWidth(0, 600);
            //    for (i = 1; i < 6; i++)
            //    {
            //        gridSLogData1.Col = i;
            //        gridSLogData1.Text = (string)gstrLogItem[i];
            //        gridSLogData1.set_ColAlignment(i, 3);
            //        gridSLogData1.set_ColWidth(i, 1200);
            //    }
            //    gridSLogData1.set_ColWidth(4, 2000);
            //    gridSLogData1.Col = 5;
            //    gridSLogData1.set_ColWidth(5, 2000);
            //    gridSLogData1.set_ColWidth(6, 700);
            //    gridSLogData1.set_ColWidth(7, 700);
            //    gridSLogData1.set_ColWidth(8, 700);
            //    n = gridSLogData1.Rows;
            //    if (n > 2)
            //    {
            //        while (n != 2)
            //        {
            //            gridSLogData1.RemoveItem((n));
            //            n = n - 1;
            //        }
            //    }
            //    gridSLogData1.Redraw = true;

            //    // gridSLogData2
            //    gridSLogData2.Row = 0;
            //    gridSLogData2.Cols = 9;
            //    gridSLogData2.set_ColWidth(0, 600);
            //    for (i = 1; i < 6; i++)
            //    {
            //        gridSLogData2.Col = i;
            //        gridSLogData2.Text = (string)gstrLogItem[i];
            //        gridSLogData2.set_ColAlignment(i, 3);
            //        gridSLogData2.set_ColWidth(i, 1200);
            //    }
            //    gridSLogData2.set_ColWidth(4, 2000);
            //    gridSLogData2.Col = 5;
            //    gridSLogData2.set_ColWidth(5, 2000);
            //    gridSLogData2.set_ColWidth(6, 700);
            //    gridSLogData2.set_ColWidth(7, 700);
            //    gridSLogData2.set_ColWidth(8, 700);
            //    n = gridSLogData2.Rows;
            //    if (n > 2)
            //    {
            //        while (n != 2)
            //        {
            //            gridSLogData2.RemoveItem((n));
            //            n = n - 1;
            //        }
            //    }
            //    gridSLogData2.Redraw = true;

            Cursor = System.Windows.Forms.Cursors.WaitCursor;
            vRet = bpc.EnableDevice(Program.gMachineNumber, 0); // 0 : false
            if (!vRet)
            {
                lblMessage.Text = util.gstrNoDevice;
                Cursor = System.Windows.Forms.Cursors.Default;
                return;
            }

            vRet = bpc.ReadGeneralLogData(Program.gMachineNumber);
            if (!vRet)
            {
                bpc.GetLastError(ref vErrorCode);
                lblMessage.Text = util.ErrorPrint(vErrorCode);
            }
            else
            {
                if (chkAndDelete.Checked)
                    bpc.EmptyGeneralLogData(Program.gMachineNumber);
            }
                if (vRet)
                {
                    Cursor = System.Windows.Forms.Cursors.WaitCursor;
                    lblMessage.Text = "Getting ...";
                    Application.DoEvents();
            //        gridSLogData.Redraw = false;
            //        gridSLogData1.Redraw = false;
            //        gridSLogData2.Redraw = false;

                    dt = new DataTable();

                    //Create Table

                    //"", "PhotoNo", "EnrollNo", "EMachineNo", "VeriMode", "DateTime"
                    dt.Columns.Add("SrNo", typeof(String));
                    dt.Columns.Add("PhotoNo", typeof(String));
                    dt.Columns.Add("EnrollNo", typeof(String));
                    dt.Columns.Add("EMachineNo", typeof(String));
                    dt.Columns.Add("VeriMode", typeof(String));
                    dt.Columns.Add("DateTime", typeof(String));

                    i = 1;
                    while (true)
                    {
                        vRet = bpc.GetGeneralLogData(   Program.gMachineNumber, 
                                                        ref vTMachineNumber, 
                                                        ref vSEnrollNumber, 
                                                        ref vSMachineNumber, 
                                                        ref vVerifyMode, 
                                                        ref vYear, 
                                                        ref vMonth, 
                                                        ref vDay, 
                                                        ref vHour, 
                                                        ref vMinute,
                                                        ref vSecond);
                        if (!vRet) break;
                        //if (vRet && i != 1) gridSLogData.AddItem(Convert.ToString(1));

                        vAntipass = vVerifyMode / vDiv;
                        vVerifyMode = vVerifyMode % vDiv;
                        vAttStatus = vVerifyMode / 256;
                        vVerifyMode = vVerifyMode % 256;
                        stAttStatus = "";
                        stAntipass = "";
                        if (vAttStatus == 0)
                            stAttStatus = "_DutyOn";
                        else if (vAttStatus == 1)
                            stAttStatus = "_DutyOff";
                        else if (vAttStatus == 2)
                            stAttStatus = "_OverOn";
                        else if (vAttStatus == 3)
                            stAttStatus = "_OverOff";
                        else if (vAttStatus == 4)
                            stAttStatus = "_GoIn";
                        else if (vAttStatus == 5)
                            stAttStatus = "_GoOut";

                        if (vAntipass == 1)
                            stAntipass = "(AP_In)";
                        else if (vAntipass == 3)
                            stAntipass = "(AP_Out)";

                        string str_Index = Convert.ToString(i);
                        string str_vTMachineNumber =  Convert.ToString(vTMachineNumber);
                        string str_vSEnrollNumber = Convert.ToString(vSEnrollNumber);
                        string str_vSMachineNumber = Convert.ToString(vSMachineNumber);
                        string str_vVerifyData = "";

            //            gridSLogData.Row = i;
            //            gridSLogData.Col = 0;
            //            gridSLogData.Text = Convert.ToString(i);
            //            gridSLogData.Col = 1;
            //            gridSLogData.Text = Convert.ToString(vTMachineNumber);
            //            gridSLogData.Col = 2;
            //            gridSLogData.Text = Convert.ToString(vSEnrollNumber);
            //            gridSLogData.Col = 3;
            //            gridSLogData.Text = Convert.ToString(vSMachineNumber);

            //            gridSLogData.Col = 4;
                        if (vVerifyMode == 1)
                            str_vVerifyData = "Fp";
                        else if (vVerifyMode == 2)
                            str_vVerifyData = "Password";
                        else if (vVerifyMode == 3)
                            str_vVerifyData = "Card";
                        else if (vVerifyMode == 4)
                            str_vVerifyData = "FP+Card";
                        else if (vVerifyMode == 5)
                            str_vVerifyData = "FP+Pwd";
                        else if (vVerifyMode == 6)
                            str_vVerifyData = "Card+Pwd";
                        else if (vVerifyMode == 7)
                            str_vVerifyData = "FP+Card+Pwd";
                        else if (vVerifyMode == 10)
                            str_vVerifyData = "Hand Lock";
                        else if (vVerifyMode == 11)
                            str_vVerifyData = "Prog Lock";
                        else if (vVerifyMode == 12)
                            str_vVerifyData = "Prog Open";
                        else if (vVerifyMode == 13)
                            str_vVerifyData = "Prog Close";
                        else if (vVerifyMode == 14)
                            str_vVerifyData = "Auto Recover";
                        else if (vVerifyMode == 20)
                            str_vVerifyData = "Lock Over";
                        else if (vVerifyMode == 21)
                            str_vVerifyData = "Illegal Open";
                        else if (vVerifyMode == 22)
                            str_vVerifyData = "Duress alarm";
                        else if (vVerifyMode == 23)
                            str_vVerifyData = "Tamper detect";
                        else
                            str_vVerifyData = "--";

                        if (1 <= vVerifyMode && vVerifyMode <= 7)
                            str_vVerifyData = str_vVerifyData + stAttStatus;

                            str_vVerifyData = str_vVerifyData + stAntipass;
            //            gridSLogData.Col = 5;
                        string PunchTime = "";
                        PunchTime = Convert.ToString(vYear) + "/" + String.Format("{0:D2}", vMonth) + "/" + String.Format("{0:D2}", vDay) + " " + String.Format("{0:D2}", vHour) + ":" + String.Format("{0:D2}", vMinute);

                        LabelTotal.Text = "Total : " + Convert.ToString(i);
                        Application.DoEvents();
                        i = i + 1;
            //            if (i > vMaxLogCnt) break;

                        DataRow dtrow;
                        dtrow = dt.NewRow();
                        dtrow["SrNo"] = str_Index;
                        dtrow["PhotoNo"] = str_vTMachineNumber;
                        dtrow["EnrollNo"] = str_vSEnrollNumber;
                        dtrow["EMachineNo"] = str_vSMachineNumber;
                        dtrow["VeriMode"] = str_vVerifyData;
                        dtrow["DateTime"] = PunchTime;
                        dt.Rows.InsertAt(dtrow, 0);

                    }

                   

            //        // gridSLogData1
            //        if (i > vMaxLogCnt)
            //        {
            //            gridSLogData.Height = gridSLogData.Height / 2;
            //            gridSLogData1.Top = gridSLogData.Top + gridSLogData.Height;
            //            gridSLogData1.Height = gridSLogData.Height;

                        //while (true)
                        //{
                        //    vRet = bpc.GetGeneralLogData(   Program.gMachineNumber, 
                        //                                    ref vTMachineNumber, 
                        //                                    ref vSEnrollNumber, 
                        //                                    ref vSMachineNumber, 
                        //                                    ref vVerifyMode, 
                        //                                    ref vYear, 
                        //                                    ref vMonth, 
                        //                                    ref vDay, 
                        //                                    ref vHour, 
                        //                                    ref vMinute,
                        //                                    ref vSecond);
                        //    if (!vRet) break;
            //                if (vRet && i != 1)
            //                    if (i - vMaxLogCnt > 1)
            //                        gridSLogData1.AddItem(Convert.ToString(1));

                            //vAntipass = vVerifyMode / vDiv;
                            //vVerifyMode = vVerifyMode % vDiv;
                            //vAttStatus = vVerifyMode / 256;
                            //vVerifyMode = vVerifyMode % 256;
                            //stAttStatus = "";
                            //stAntipass = "";
                            //if (vAttStatus == 0)
                            //    stAttStatus = "_DutyOn";
                            //else if (vAttStatus == 1)
                            //    stAttStatus = "_DutyOff";
                            //else if (vAttStatus == 2)
                            //    stAttStatus = "_OverOn";
                            //else if (vAttStatus == 3)
                            //    stAttStatus = "_OverOff";
                            //else if (vAttStatus == 4)
                            //    stAttStatus = "_GoIn";
                            //else if (vAttStatus == 5)
                            //    stAttStatus = "_GoOut";

                            //if (vAntipass == 1)
                            //    stAntipass = "(AP_In)";
                            //else if (vAntipass == 3)
                            //    stAntipass = "(AP_Out)";

            //                gridSLogData1.Row = i - vMaxLogCnt;
            //                gridSLogData1.Col = 0;
            //                gridSLogData1.Text = Convert.ToString(i);
            //                gridSLogData1.Col = 1;
            //                gridSLogData1.Text = Convert.ToString(vTMachineNumber);
            //                gridSLogData1.Col = 2;
            //                gridSLogData1.Text = Convert.ToString(vSEnrollNumber);
            //                gridSLogData1.Col = 3;
            //                gridSLogData1.Text = Convert.ToString(vSMachineNumber);

            //                gridSLogData1.Col = 4;
            //                if (vVerifyMode == 1)
            //                    gridSLogData1.Text = "Fp";
            //                else if (vVerifyMode == 2)
            //                    gridSLogData1.Text = "Password";
            //                else if (vVerifyMode == 3)
            //                    gridSLogData1.Text = "Card";
            //                else if (vVerifyMode == 4)
            //                    gridSLogData1.Text = "FP+Card";
            //                else if (vVerifyMode == 5)
            //                    gridSLogData1.Text = "FP+Pwd";
            //                else if (vVerifyMode == 6)
            //                    gridSLogData1.Text = "Card+Pwd";
            //                else if (vVerifyMode == 7)
            //                    gridSLogData1.Text = "FP+Card+Pwd";
            //                else if (vVerifyMode == 10)
            //                    gridSLogData1.Text = "Hand Lock";
            //                else if (vVerifyMode == 11)
            //                    gridSLogData1.Text = "Prog Lock";
            //                else if (vVerifyMode == 12)
            //                    gridSLogData1.Text = "Prog Open";
            //                else if (vVerifyMode == 13)
            //                    gridSLogData1.Text = "Prog Close";
            //                else if (vVerifyMode == 14)
            //                    gridSLogData1.Text = "Auto Recover";
            //                else if (vVerifyMode == 20)
            //                    gridSLogData1.Text = "Lock Over";
            //                else if (vVerifyMode == 21)
            //                    gridSLogData1.Text = "Illegal Open";
            //                else if (vVerifyMode == 22)
            //                    gridSLogData1.Text = "Duress alarm";
            //                else if (vVerifyMode == 23)
            //                    gridSLogData1.Text = "Tamper detect";
            //                else
            //                    gridSLogData1.Text = "--";

            //                if (1 <= vVerifyMode && vVerifyMode <= 7)
            //                    gridSLogData1.Text = gridSLogData1.Text + stAttStatus;

            //                gridSLogData1.Text = gridSLogData1.Text + stAntipass;
            //                gridSLogData1.Col = 5;
            //                gridSLogData1.Text = Convert.ToString(vYear) + "/" + String.Format("{0:D2}", vMonth) + "/" + String.Format("{0:D2}", vDay) + " " + String.Format("{0:D2}", vHour) + ":" + String.Format("{0:D2}", vMinute);

            //                LabelTotal.Text = "Total : " + Convert.ToString(i);
            //                Application.DoEvents();
            //                i = i + 1;
            //                if (i > vMaxLogCnt * 2) break;

            //            }
            //        }

            //        // gridSLogData2
            //        vMaxLogCnt = vMaxLogCnt * 2;
            //        if (i > vMaxLogCnt)
            //        {
            //            gridSLogData.Height = gridSLogData.Height * 2 / 3;
            //            gridSLogData1.Top = gridSLogData.Top + gridSLogData.Height;
            //            gridSLogData1.Height = gridSLogData.Height;
            //            gridSLogData2.Top = gridSLogData.Top + gridSLogData.Height * 2;
            //            gridSLogData2.Height = gridSLogData.Height;

            //            while (true)
            //            {
            //                vRet = bpc.GetGeneralLogData(Program.gMachineNumber, 
            //                                                ref vTMachineNumber, 
            //                                                ref vSEnrollNumber, 
            //                                                ref vSMachineNumber, 
            //                                                ref vVerifyMode, 
            //                                                ref vYear, 
            //                                                ref vMonth, 
            //                                                ref vDay, 
            //                                                ref vHour, 
            //                                                ref vMinute,
            //                                                ref vSecond);
            //                if (!vRet) break;
            //                if (vRet && i != 1)
            //                    if (i - vMaxLogCnt > 1)
            //                        gridSLogData2.AddItem(Convert.ToString(1));

            //                vAntipass = vVerifyMode / vDiv;
            //                vVerifyMode = vVerifyMode % vDiv;
            //                vAttStatus = vVerifyMode / 256;
            //                vVerifyMode = vVerifyMode % 256;
            //                stAttStatus = "";
            //                stAntipass = "";
            //                if (vAttStatus == 0)
            //                    stAttStatus = "_DutyOn";
            //                else if (vAttStatus == 1)
            //                    stAttStatus = "_DutyOff";
            //                else if (vAttStatus == 2)
            //                    stAttStatus = "_OverOn";
            //                else if (vAttStatus == 3)
            //                    stAttStatus = "_OverOff";
            //                else if (vAttStatus == 4)
            //                    stAttStatus = "_GoIn";
            //                else if (vAttStatus == 5)
            //                    stAttStatus = "_GoOut";

            //                if (vAntipass == 1)
            //                    stAntipass = "(AP_In)";
            //                else if (vAntipass == 3)
            //                    stAntipass = "(AP_Out)";

            //                gridSLogData2.Row = i - vMaxLogCnt;
            //                gridSLogData2.Col = 0;
            //                gridSLogData2.Text = Convert.ToString(i);
            //                gridSLogData2.Col = 1;
            //                gridSLogData2.Text = Convert.ToString(vTMachineNumber);
            //                gridSLogData2.Col = 2;
            //                gridSLogData2.Text = Convert.ToString(vSEnrollNumber);
            //                gridSLogData2.Col = 3;
            //                gridSLogData2.Text = Convert.ToString(vSMachineNumber);

            //                gridSLogData2.Col = 4;
            //                if (vVerifyMode == 1)
            //                    gridSLogData2.Text = "Fp";
            //                else if (vVerifyMode == 2)
            //                    gridSLogData2.Text = "Password";
            //                else if (vVerifyMode == 3)
            //                    gridSLogData2.Text = "Card";
            //                else if (vVerifyMode == 4)
            //                    gridSLogData2.Text = "FP+Card";
            //                else if (vVerifyMode == 5)
            //                    gridSLogData2.Text = "FP+Pwd";
            //                else if (vVerifyMode == 6)
            //                    gridSLogData2.Text = "Card+Pwd";
            //                else if (vVerifyMode == 7)
            //                    gridSLogData2.Text = "FP+Card+Pwd";
            //                else if (vVerifyMode == 10)
            //                    gridSLogData2.Text = "Hand Lock";
            //                else if (vVerifyMode == 11)
            //                    gridSLogData2.Text = "Prog Lock";
            //                else if (vVerifyMode == 12)
            //                    gridSLogData2.Text = "Prog Open";
            //                else if (vVerifyMode == 13)
            //                    gridSLogData2.Text = "Prog Close";
            //                else if (vVerifyMode == 14)
            //                    gridSLogData2.Text = "Auto Recover";
            //                else if (vVerifyMode == 20)
            //                    gridSLogData2.Text = "Lock Over";
            //                else if (vVerifyMode == 21)
            //                    gridSLogData2.Text = "Illegal Open";
            //                else if (vVerifyMode == 22)
            //                    gridSLogData2.Text = "Duress alarm";
            //                else if (vVerifyMode == 23)
            //                    gridSLogData2.Text = "Tamper detect";
            //                else
            //                    gridSLogData2.Text = "--";

            //                if (1 <= vVerifyMode && vVerifyMode <= 7)
            //                    gridSLogData2.Text = gridSLogData2.Text + stAttStatus;

            //                gridSLogData2.Text = gridSLogData2.Text + stAntipass;
            //                gridSLogData2.Col = 5;
            //                gridSLogData2.Text = Convert.ToString(vYear) + "/" + String.Format("{0:D2}", vMonth) + "/" + String.Format("{0:D2}", vDay) + " " + String.Format("{0:D2}", vHour) + ":" + String.Format("{0:D2}", vMinute);

            //                LabelTotal.Text = "Total : " + Convert.ToString(i);
            //                Application.DoEvents();
            //                i = i + 1;
            //                if (i > gMaxLow * 3) break;
            //            }
            //        }
            //        gridSLogData.Redraw = true;
            //        gridSLogData1.Redraw = true;
            //        gridSLogData2.Redraw = true;

                    GrdLogData.DataSource = dt;

                    lblMessage.Text = "ReadGeneralLogData OK";
                }

                Cursor = System.Windows.Forms.Cursors.Default;
                bpc.EnableDevice(Program.gMachineNumber, 1); // 1 : true
        }

        private void cmdAllGLogData_Click(object sender, EventArgs e)
        {
            glogSearched = true;

            int vTMachineNumber = 0;
            int vSMachineNumber = 0;
            int vSEnrollNumber = 0;
            int vVerifyMode = 0;
            int vYear = 0;
            int vMonth = 0;
            int vDay = 0;
            int vHour = 0;
            int vMinute = 0;
            int vSecond = 0;
            Boolean vRet;
            int vErrorCode = 0;
            int i;
            int n;
            int vMaxLogCnt;

            vMaxLogCnt = gMaxLow;

            lblMessage.Text = "Waiting...";
            LabelTotal.Text = "Total : ";

            //    gridSLogData.Redraw = false;
            //    gridSLogData.Height = 298;
            //    gridSLogData.Clear();
            //    gridSLogData1.Top = gridSLogData.Top + gridSLogData.Height;
            //    gridSLogData1.Height = 0;
            //    gridSLogData1.Redraw = false;
            //    gridSLogData1.Clear();
            //    gridSLogData2.Top = gridSLogData.Top + gridSLogData.Height;
            //    gridSLogData2.Height = 0;
            //    gridSLogData2.Redraw = false;
            //    gridSLogData2.Clear();

            gstrLogItem = new Object[] { "SrNo", "PhotoNo", "EnrollNo", "EMachineNo", "VeriMode", "DateTime" };

            //    // gridSLogData
            //    gridSLogData.Row = 0;
            //    gridSLogData.Cols = 9;
            //    gridSLogData.set_ColWidth(0, 600);
            //    for (i = 1; i < 6; i++)
            //    {
            //        gridSLogData.Col = i;
            //        gridSLogData.Text = (string)gstrLogItem[i];
            //        gridSLogData.set_ColAlignment(i, 3);
            //        gridSLogData.set_ColWidth(i, 1200);
            //    }
            //    gridSLogData.set_ColWidth(4, 2000);
            //    gridSLogData.Col = 5;
            //    gridSLogData.set_ColWidth(5, 2000);
            //    gridSLogData.set_ColWidth(6, 700);
            //    gridSLogData.set_ColWidth(7, 700);
            //    gridSLogData.set_ColWidth(8, 700);
            //    n = gridSLogData.Rows;
            //    if (n > 2)
            //    {
            //        while (n != 2)
            //        {
            //            gridSLogData.RemoveItem((n));
            //            n = n - 1;
            //        }
            //    }
            //    gridSLogData.Redraw = true;

            //    // gridSLogData1
            //    gridSLogData1.Row = 0;
            //    gridSLogData1.Cols = 9;
            //    gridSLogData1.set_ColWidth(0, 600);
            //    for (i = 1; i < 6; i++)
            //    {
            //        gridSLogData1.Col = i;
            //        gridSLogData1.Text = (string)gstrLogItem[i];
            //        gridSLogData1.set_ColAlignment(i, 3);
            //        gridSLogData1.set_ColWidth(i, 1200);
            //    }
            //    gridSLogData1.set_ColWidth(4, 2000);
            //    gridSLogData1.Col = 5;
            //    gridSLogData1.set_ColWidth(5, 2000);
            //    gridSLogData1.set_ColWidth(6, 700);
            //    gridSLogData1.set_ColWidth(7, 700);
            //    gridSLogData1.set_ColWidth(8, 700);
            //    n = gridSLogData1.Rows;
            //    if (n > 2)
            //    {
            //        while (n != 2)
            //        {
            //            gridSLogData1.RemoveItem((n));
            //            n = n - 1;
            //        }
            //    }
            //    gridSLogData1.Redraw = true;

            //    // gridSLogData2
            //    gridSLogData2.Row = 0;
            //    gridSLogData2.Cols = 9;
            //    gridSLogData2.set_ColWidth(0, 600);
            //    for (i = 1; i < 6; i++)
            //    {
            //        gridSLogData2.Col = i;
            //        gridSLogData2.Text = (string)gstrLogItem[i];
            //        gridSLogData2.set_ColAlignment(i, 3);
            //        gridSLogData2.set_ColWidth(i, 1200);
            //    }
            //    gridSLogData2.set_ColWidth(4, 2000);
            //    gridSLogData2.Col = 5;
            //    gridSLogData2.set_ColWidth(5, 2000);
            //    gridSLogData2.set_ColWidth(6, 700);
            //    gridSLogData2.set_ColWidth(7, 700);
            //    gridSLogData2.set_ColWidth(8, 700);
            //    n = gridSLogData2.Rows;
            //    if (n > 2)
            //    {
            //        while (n != 2)
            //        {
            //            gridSLogData2.RemoveItem((n));
            //            n = n - 1;
            //        }
            //    }
            //    gridSLogData2.Redraw = true;

            Cursor = System.Windows.Forms.Cursors.WaitCursor;
            vRet = bpc.EnableDevice(Program.gMachineNumber, 0); // 0 : false
            if (!vRet)
            {
                lblMessage.Text = util.gstrNoDevice;
                Cursor = System.Windows.Forms.Cursors.Default;
                return;
            }

            vRet = bpc.ReadAllGLogData(Program.gMachineNumber);
            if (!vRet)
            {
                bpc.GetLastError(ref vErrorCode);
                lblMessage.Text = util.ErrorPrint(vErrorCode);
            }
            else
            {
                if (chkAndDelete.Checked)
                    bpc.EmptyGeneralLogData(Program.gMachineNumber);
            }
            if (vRet)
            {
                Cursor = System.Windows.Forms.Cursors.WaitCursor;
                lblMessage.Text = "Getting ...";
                Application.DoEvents();
                //        gridSLogData.Redraw = false;
                //        gridSLogData1.Redraw = false;
                //        gridSLogData2.Redraw = false;
                dt = new DataTable();

                //Create Table

                //"", "PhotoNo", "EnrollNo", "EMachineNo", "VeriMode", "DateTime"
                dt.Columns.Add("SrNo", typeof(String));
                dt.Columns.Add("PhotoNo", typeof(String));
                dt.Columns.Add("EnrollNo", typeof(String));
                dt.Columns.Add("EMachineNo", typeof(String));
                dt.Columns.Add("VeriMode", typeof(String));
                dt.Columns.Add("DateTime", typeof(String));


                i = 1;
                while (true)
                {
                    vRet = bpc.GetAllGLogData(Program.gMachineNumber,
                                                ref vTMachineNumber,
                                                ref vSEnrollNumber,
                                                ref vSMachineNumber,
                                                ref vVerifyMode,
                                                ref vYear,
                                                ref vMonth,
                                                ref vDay,
                                                ref vHour,
                                                ref vMinute,
                                                ref vSecond);
                    if (!vRet) break;
                    //if (vRet && i != 1) gridSLogData.AddItem(Convert.ToString(1));

                    AddGLogItem(vTMachineNumber,
                                vSEnrollNumber,
                                vSMachineNumber,
                                vVerifyMode,
                                vYear,
                                vMonth,
                                vDay,
                                vHour,
                                vMinute,
                                vSecond,
                                i,
                                0,
                                GrdLogData
                               );

                    LabelTotal.Text = "Total : " + Convert.ToString(i);
                    Application.DoEvents();
                    i = i + 1;
                    //            if (i > vMaxLogCnt) break;

                }

                //        if (i > vMaxLogCnt)
                //        {
                //            gridSLogData.Height = gridSLogData.Height / 2;
                //            gridSLogData1.Top = gridSLogData.Top + gridSLogData.Height;
                //            gridSLogData1.Height = gridSLogData.Height;

                //            while (true)
                //            {
                //                vRet = bpc.GetAllGLogData(  Program.gMachineNumber, 
                //                                            ref vTMachineNumber, 
                //                                            ref vSEnrollNumber, 
                //                                            ref vSMachineNumber, 
                //                                            ref vVerifyMode, 
                //                                            ref vYear, 
                //                                            ref vMonth, 
                //                                            ref vDay, 
                //                                            ref vHour, 
                //                                            ref vMinute,
                //                                            ref vSecond);
                //                if (!vRet) break;
                //                if (vRet && i != 1)
                //                    if (i - vMaxLogCnt > 1)
                //                        gridSLogData1.AddItem(Convert.ToString(1));

                //                AddGLogItem(vTMachineNumber,
                //                            vSEnrollNumber,
                //                            vSMachineNumber,
                //                            vVerifyMode,
                //                            vYear,
                //                            vMonth,
                //                            vDay,
                //                            vHour,
                //                            vMinute,
                //                            vSecond,
                //                            i,
                //                            vMaxLogCnt,
                //                            gridSLogData1
                //                           );

                //                LabelTotal.Text = "Total : " + Convert.ToString(i);
                //                Application.DoEvents();
                //                i = i + 1;
                //                if (i > vMaxLogCnt * 2) break;

                //            }
                //        }

                //        vMaxLogCnt = vMaxLogCnt * 2;
                //        if (i > vMaxLogCnt)
                //        {
                //            gridSLogData.Height = gridSLogData.Height * 2 / 3;
                //            gridSLogData1.Top = gridSLogData.Top + gridSLogData.Height;
                //            gridSLogData1.Height = gridSLogData.Height;
                //            gridSLogData2.Top = gridSLogData.Top + gridSLogData.Height * 2;
                //            gridSLogData2.Height = gridSLogData.Height;

                //            while (true)
                //            {
                //                vRet = bpc.GetAllGLogData(  Program.gMachineNumber, 
                //                                            ref vTMachineNumber, 
                //                                            ref vSEnrollNumber, 
                //                                            ref vSMachineNumber, 
                //                                            ref vVerifyMode, 
                //                                            ref vYear, 
                //                                            ref vMonth, 
                //                                            ref vDay, 
                //                                            ref vHour, 
                //                                            ref vMinute,
                //                                            ref vSecond);
                //                if (!vRet) break;
                //                if (vRet && i != 1)
                //                    if (i - vMaxLogCnt > 1)
                //                        gridSLogData2.AddItem(Convert.ToString(1));

                //                AddGLogItem(vTMachineNumber,
                //                            vSEnrollNumber,
                //                            vSMachineNumber,
                //                            vVerifyMode,
                //                            vYear,
                //                            vMonth,
                //                            vDay,
                //                            vHour,
                //                            vMinute,
                //                            vSecond,
                //                            i,
                //                            vMaxLogCnt,
                //                            gridSLogData2
                //                           );

                //                LabelTotal.Text = "Total : " + Convert.ToString(i);
                //                Application.DoEvents();
                //                i = i + 1;
                //                if (i > gMaxLow * 3) break;
                //            }
                //        }
                //        gridSLogData.Redraw = true;
                //        gridSLogData1.Redraw = true;
                //        gridSLogData2.Redraw = true;
                GrdLogData.DataSource = dt;
                lblMessage.Text = "ReadAllGLogData OK";
            }

            Cursor = System.Windows.Forms.Cursors.Default;
            bpc.EnableDevice(Program.gMachineNumber, 1); // 1 : true
        }

        private void cmdEmptyGLog_Click(object sender, EventArgs e)
        {
            Boolean vRet;
            int vErrorCode = 0;

            lblMessage.Text = "Working...";
            Application.DoEvents();

            vRet = bpc.EnableDevice(Program.gMachineNumber, 0); // 0 : false
            if (!vRet)
            {
                lblMessage.Text = util.gstrNoDevice;
                return;
            }

            vRet = bpc.EmptyGeneralLogData(Program.gMachineNumber);
            if (vRet)
            {
                lblMessage.Text = "EmptyGeneralLogData OK";
            }
            else
            {
                bpc.GetLastError(ref vErrorCode);
                lblMessage.Text = util.ErrorPrint(vErrorCode);
            }

            bpc.EnableDevice(Program.gMachineNumber, 1); // 1 : true
        }

        private void cmdExit_Click(object sender, EventArgs e)
        {
            Close();
            Application.OpenForms["frmMain"].Visible = true;
        }

        private void frmLog_Load(object sender, EventArgs e)
        {
            bpc = (AxSBXPCLib.AxSBXPC)Application.OpenForms["frmMain"].Controls["BioTime"];
            picGlogPhoto.Image = null;
            chkReadMark.Checked = true;
        }

        private void chkReadMark_CheckedChanged(object sender, EventArgs e)
        {
            bpc.ReadMark = chkReadMark.Checked;
        }

        private void btnSetRange_Click(object sender, EventArgs e)
        {
            bool bRet = false;
            int vErrorCode = 0;
            String strXML = "";

            lblMessage.Text = "Working...";
            Application.DoEvents();

            bRet = bpc.EnableDevice(Program.gMachineNumber, 0); // 0 : disable
            if (!bRet)
            {
                lblMessage.Text = util.gstrNoDevice;
                return;
            }

            util.MakeXMLRequestHeader(bpc, ref strXML, "SetGLogSearchRange");
            bpc.XML_AddBoolean(ref strXML, "UseSearchRange", chkSearchRangeUse.Checked);

            if (chkSearchRangeUse.Checked)
            {
                bpc.XML_AddLong(ref strXML, "StartYear", dtGlogSearchStart.Value.Year);
                bpc.XML_AddLong(ref strXML, "StartMonth", dtGlogSearchStart.Value.Month);
                bpc.XML_AddLong(ref strXML, "StartDate", dtGlogSearchStart.Value.Day);
                bpc.XML_AddLong(ref strXML, "EndYear", dtGlogSearchEnd.Value.Year);
                bpc.XML_AddLong(ref strXML, "EndMonth", dtGlogSearchEnd.Value.Month);
                bpc.XML_AddLong(ref strXML, "EndDate", dtGlogSearchEnd.Value.Day);
            }

            bRet = bpc.GeneralOperationXML(ref strXML);

            if (bRet)
                lblMessage.Text = "SetGlogSearchRange OK";
            else
            {
                bpc.GetLastError(ref vErrorCode);
                lblMessage.Text = util.ErrorPrint(vErrorCode);
            }

            bRet = bpc.EnableDevice(Program.gMachineNumber, 1); // 1 : enable
        }

        private void AddGLogItem(int vTMachineNumber, int vSEnrollNumber, int vSMachineNumber, int vVerifyMode, int vYear, int vMonth, int vDay, int vHour, int vMinute, int vSecond, int index, int vMaxLogCnt, DataGridView gridGlogData)
        {
            int vAttStatus, vAntipass;
            string stAttStatus, stAntipass;
            int vDiv = 65536;

            vAntipass = vVerifyMode / vDiv;
            vVerifyMode = vVerifyMode % vDiv;
            vAttStatus = vVerifyMode / 256;
            vVerifyMode = vVerifyMode % 256;
            stAttStatus = "";
            stAntipass = "";
            if (vAttStatus == 0)
                stAttStatus = "_DutyOn";
            else if (vAttStatus == 1)
                stAttStatus = "_DutyOff";
            else if (vAttStatus == 2)
                stAttStatus = "_OverOn";
            else if (vAttStatus == 3)
                stAttStatus = "_OverOff";
            else if (vAttStatus == 4)
                stAttStatus = "_GoIn";
            else if (vAttStatus == 5)
                stAttStatus = "_GoOut";

            if (vAntipass == 1)
                stAntipass = "(AP_In)";
            else if (vAntipass == 3)
                stAntipass = "(AP_Out)";

            //gridGlogData.Row = index - vMaxLogCnt;

            string str_Index = Convert.ToString(index);
            string str_vTMachineNumber = vTMachineNumber == -1 ? "No Photo" : Convert.ToString(vTMachineNumber);
            string str_vSEnrollNumber = Convert.ToString(vSEnrollNumber);
            string str_vSMachineNumber = Convert.ToString(vSMachineNumber);
            string str_vVerifyData = "";
            //gridGlogData.Col = 0;
            //gridGlogData.Text = Convert.ToString(index);
            //gridGlogData.Col = 1;
            //gridGlogData.Text = vTMachineNumber == -1 ? "No Photo" : Convert.ToString(vTMachineNumber);
            //gridGlogData.Col = 2;
            //gridGlogData.Text = Convert.ToString(vSEnrollNumber);
            //gridGlogData.Col = 3;
            //gridGlogData.Text = Convert.ToString(vSMachineNumber);

            //    gridGlogData.Col = 4;
            if (vVerifyMode == 1)
                str_vVerifyData = "Fp";
            else if (vVerifyMode == 2)
                str_vVerifyData = "Password";
            else if (vVerifyMode == 3)
                str_vVerifyData = "Card";
            else if (vVerifyMode == 4)
                str_vVerifyData = "FP+Card";
            else if (vVerifyMode == 5)
                str_vVerifyData = "FP+Pwd";
            else if (vVerifyMode == 6)
                str_vVerifyData = "Card+Pwd";
            else if (vVerifyMode == 7)
                str_vVerifyData = "FP+Card+Pwd";
            else if (vVerifyMode == 10)
                str_vVerifyData = "Hand Lock";
            else if (vVerifyMode == 11)
                str_vVerifyData = "Prog Lock";
            else if (vVerifyMode == 12)
                str_vVerifyData = "Prog Open";
            else if (vVerifyMode == 13)
                str_vVerifyData = "Prog Close";
            else if (vVerifyMode == 14)
                str_vVerifyData = "Auto Recover";
            else if (vVerifyMode == 20)
                str_vVerifyData = "Lock Over";
            else if (vVerifyMode == 21)
                str_vVerifyData = "Illegal Open";
            else if (vVerifyMode == 22)
                str_vVerifyData = "Duress alarm";
            else if (vVerifyMode == 23)
                str_vVerifyData = "Tamper detect";
            else if (vVerifyMode == 51)
                str_vVerifyData = "Fp";
            else if (vVerifyMode == 52)
                str_vVerifyData = "Password";
            else if (vVerifyMode == 53)
                str_vVerifyData = "Card";
            else if (vVerifyMode == 101)
                str_vVerifyData = "Fp";
            else if (vVerifyMode == 102)
                str_vVerifyData = "Password";
            else if (vVerifyMode == 103)
                str_vVerifyData = "Card";
            else if (vVerifyMode == 151)
                str_vVerifyData = "Fp";
            else if (vVerifyMode == 152)
                str_vVerifyData = "Password";
            else if (vVerifyMode == 153)
                str_vVerifyData = "Card";
            else
                str_vVerifyData = "--";

            if (1 <= vVerifyMode && vVerifyMode <= 7)
                str_vVerifyData = str_vVerifyData + stAttStatus;
            else if (51 <= vVerifyMode && vVerifyMode <= 53)
                str_vVerifyData = str_vVerifyData + stAttStatus;
            else if (101 <= vVerifyMode && vVerifyMode <= 103)
                str_vVerifyData = str_vVerifyData + stAttStatus;
            else if (151 <= vVerifyMode && vVerifyMode <= 153)
                str_vVerifyData = str_vVerifyData + stAttStatus;

            str_vVerifyData = str_vVerifyData + stAntipass;
            //    gridGlogData.Col = 5;
            string PunchTime = "";
            PunchTime = Convert.ToString(vYear) + "/" + String.Format("{0:D2}", vMonth) + "/" + String.Format("{0:D2}", vDay) + " " + String.Format("{0:D2}", vHour) + ":" + String.Format("{0:D2}", vMinute);

            DataRow dtrow;
            dtrow = dt.NewRow();
            dtrow["SrNo"] = str_Index;
            dtrow["PhotoNo"] = str_vTMachineNumber;
            dtrow["EnrollNo"] = str_vSEnrollNumber;
            dtrow["EMachineNo"] = str_vSMachineNumber;
            dtrow["VeriMode"] = str_vVerifyData;
            dtrow["DateTime"] = PunchTime;
            dt.Rows.InsertAt(dtrow, 0);
            //Dim dtrow As DataRow = dt.NewRow()
            //dtrow("EnrollNo") = aSEnrollNumber
            //dtrow("VerifyMode") = vStr
            //dtrow("InOutMode") = VInOut
            //dtrow("DateTimeValue") = PunchTime.ToString("yyyy-MM-dd HH:mm:ss")
            //dtrow("IP") = astrRemoteIP
            //dtrow("Port") = anRemotePort
            //dtrow("DeviceId") = anDeviceId
            //dtrow("SerialNo") = anSerialNo
            //dt.Rows.InsertAt(dtrow, 0)
        }
            
        private void frmLog_FormClosing(object sender, FormClosingEventArgs e)
        {
            Application.OpenForms["frmMain"].Visible = true;
            ClearGlogPhoto();
        }

        private void ClearGlogPhoto()
        {
            if (picGlogPhoto.Image != null) picGlogPhoto.Image.Dispose();
            picGlogPhoto.Image = null;
        }
    }
}
