using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
//using System.Linq;
using System.Text;
using System.Windows.Forms;

namespace SBXPCSampleCSharp
{
    public partial class frmMain : Form
    {
        public frmMain()
        {
            InitializeComponent();
        }

        frmEvent frm_event = new frmEvent();

        Boolean mOpenFlag;
        private void cmdOpen_Click(object sender, EventArgs e)
        {
            String lpszIPAddress;
            //		Dim vRet As Boolean
    		
            Program.gMachineNumber = Convert.ToInt32(cmbMachineNumber.Text);
		    if (optNetworkDevice.Checked)
            {
			    lpszIPAddress = txtIPAddress.Text;
			    if (BioTime.ConnectTcpip(Program.gMachineNumber, ref lpszIPAddress, Convert.ToInt32(txtPortNo.Text), Convert.ToInt32(txtPassword.Text))) 
                {
				    mOpenFlag = true;
				    cmdOpen.Enabled = false;

				    cmdClose.Enabled = true;
				    cmdEnrollData.Enabled = true;
				    cmdLogData.Enabled = true;
				    cmdSystemInfo.Enabled = true;
				    cmdProuctCode.Enabled = true;
				    cmdBellInfo.Enabled = true;
				    cmdLockCtl.Enabled = true;
                    cmdAccessTz.Enabled = true;
                    cmdLogTz.Enabled = true;
                    cmdDepartment.Enabled = true;
                    cmdProxy.Enabled = true;
                    cmdScreenSaver.Enabled = true;
			    }
		    }
		    if (optSerialDevice.Checked)
            {
			    if (BioTime.ConnectSerial(Program.gMachineNumber, cmbComPort.SelectedIndex + 1, Convert.ToInt32(cmbBaudrate.Text)))
                {
				    mOpenFlag = true;
				    cmdOpen.Enabled = false;
				    cmdClose.Enabled = true;
				    cmdEnrollData.Enabled = true;
				    cmdLogData.Enabled = true;
				    cmdSystemInfo.Enabled = true;
				    cmdProuctCode.Enabled = true;
				    cmdBellInfo.Enabled = true;
				    cmdLockCtl.Enabled = true;
                    cmdAccessTz.Enabled = true;
                    cmdLogTz.Enabled = true;
                    cmdDepartment.Enabled = true;
                    cmdProxy.Enabled = true;
                    cmdScreenSaver.Enabled = true;
                }
		    }
            if (optUSBDevice.Checked)
            {
                if (BioTime.ConnectSerial(Program.gMachineNumber, 0, 0))
                {
                    mOpenFlag = true;
                    cmdOpen.Enabled = false;
                    cmdClose.Enabled = true;
                    cmdEnrollData.Enabled = true;
                    cmdLogData.Enabled = true;
                    cmdSystemInfo.Enabled = true;
                    cmdProuctCode.Enabled = true;
                    cmdBellInfo.Enabled = true;
                    cmdLockCtl.Enabled = true;
                    cmdAccessTz.Enabled = true;
                    cmdLogTz.Enabled = true;
                    cmdDepartment.Enabled = true;
                    cmdProxy.Enabled = true;
                    cmdScreenSaver.Enabled = true;
                }
            }
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            //BioTime.AboutBox();
            
            optSerialDevice.Checked = false;
            lblComPort.Enabled = false;
            cmbComPort.Enabled = false;
            lblBaudrate.Enabled = false;
            cmbBaudrate.Enabled = false;

            optNetworkDevice.Checked = true;
            lblIPAddress.Enabled = true;
            txtIPAddress.Enabled = true;
            lblPortNo.Enabled = true;
            txtPortNo.Enabled = true;
            lblPassword.Enabled = true;
            txtPassword.Enabled = true;

            cmdOpen.Enabled = true;
            cmdClose.Enabled = false;
            cmdEnrollData.Enabled = false;
            cmdLogData.Enabled = false;
            cmdSystemInfo.Enabled = false;
            cmdProuctCode.Enabled = false;
            cmdBellInfo.Enabled = false;
            cmdLockCtl.Enabled = false;
            cmdAccessTz.Enabled = false;
            cmdLogTz.Enabled = false;
            cmdDepartment.Enabled = false;
            cmdProxy.Enabled = false;
            cmdScreenSaver.Enabled = false;

            mOpenFlag = false;
            cmbMachineNumber.Text = Convert.ToString(1);
            cmbComPort.Text = Convert.ToString(1);
            cmbBaudrate.Text = "115200";

            BioTime.DotNET();
        }

        private void cmdClose_Click(object sender, EventArgs e)
        {
            if (mOpenFlag == true)
            {
                BioTime.Disconnect();
			    mOpenFlag = false;
			    cmdOpen.Enabled = true;
			    cmdClose.Enabled = false;
			    cmdEnrollData.Enabled = false;
			    cmdLogData.Enabled = false;
			    cmdSystemInfo.Enabled = false;
			    cmdProuctCode.Enabled = false;
			    cmdBellInfo.Enabled = false;
			    cmdLockCtl.Enabled = false;
		    }
        }

        private void optSerialDevice_CheckedChanged(object sender, EventArgs e)
        {
            if (optSerialDevice.Checked)
            {
                String lpszIPAddress;
                optSerialDevice.Checked = true;
                optNetworkDevice.Checked = false;
                optUSBDevice.Checked = false;

                if (optSerialDevice.Checked)
                {
                    lblComPort.Enabled = true;
                    cmbComPort.Enabled = true;
                    lblBaudrate.Enabled = true;
                    cmbBaudrate.Enabled = true;
                    lblIPAddress.Enabled = false;
                    txtIPAddress.Enabled = false;
                    lblPortNo.Enabled = false;
                    txtPortNo.Enabled = false;
                    lblPassword.Enabled = false;
                    txtPassword.Enabled = false;
                }
                else if (optNetworkDevice.Checked)
                {
                    lblComPort.Enabled = false;
                    cmbComPort.Enabled = false;
                    lblBaudrate.Enabled = false;
                    cmbBaudrate.Enabled = false;
                    lblIPAddress.Enabled = true;
                    txtIPAddress.Enabled = true;
                    lblPortNo.Enabled = true;
                    txtPortNo.Enabled = true;
                    lblPassword.Enabled = true;
                    txtPassword.Enabled = true;
                    lpszIPAddress = txtIPAddress.Text;
                }
                else
                {
                    lblComPort.Enabled = false;
                    cmbComPort.Enabled = false;
                    lblBaudrate.Enabled = false;
                    cmbBaudrate.Enabled = false;
                    lblIPAddress.Enabled = false;
                    txtIPAddress.Enabled = false;
                    lblPortNo.Enabled = false;
                    txtPortNo.Enabled = false;
                    lblPassword.Enabled = false;
                    txtPassword.Enabled = false;
                }
            }
        }

        private void optNetworkDevice_CheckedChanged(object sender, EventArgs e)
        {
            if (optNetworkDevice.Checked)
            {
                String lpszIPAddress;
                optSerialDevice.Checked = false;
                optNetworkDevice.Checked = true;
                optUSBDevice.Checked = false;

                if (optSerialDevice.Checked)
                {
                    lblComPort.Enabled = true;
                    cmbComPort.Enabled = true;
                    lblBaudrate.Enabled = true;
                    cmbBaudrate.Enabled = true;
                    lblIPAddress.Enabled = false;
                    txtIPAddress.Enabled = false;
                    lblPortNo.Enabled = false;
                    txtPortNo.Enabled = false;
                    lblPassword.Enabled = false;
                    txtPassword.Enabled = false;
                }
                else if (optNetworkDevice.Checked)
                {
                    lblComPort.Enabled = false;
                    cmbComPort.Enabled = false;
                    lblBaudrate.Enabled = false;
                    cmbBaudrate.Enabled = false;
                    lblIPAddress.Enabled = true;
                    txtIPAddress.Enabled = true;
                    lblPortNo.Enabled = true;
                    txtPortNo.Enabled = true;
                    lblPassword.Enabled = true;
                    txtPassword.Enabled = true;
                    lpszIPAddress = txtIPAddress.Text;
                }
                else
                {
                    lblComPort.Enabled = false;
                    cmbComPort.Enabled = false;
                    lblBaudrate.Enabled = false;
                    cmbBaudrate.Enabled = false;
                    lblIPAddress.Enabled = false;
                    txtIPAddress.Enabled = false;
                    lblPortNo.Enabled = false;
                    txtPortNo.Enabled = false;
                    lblPassword.Enabled = false;
                    txtPassword.Enabled = false;
                }
            }
        }

        private void optUSBDevice_CheckedChanged(object sender, EventArgs e)
        {
            if (optUSBDevice.Checked)
            {
                String lpszIPAddress;
                optSerialDevice.Checked = false;
                optNetworkDevice.Checked = false;
                optUSBDevice.Checked = true;

                if (optSerialDevice.Checked)
                {
                    lblComPort.Enabled = true;
                    cmbComPort.Enabled = true;
                    lblBaudrate.Enabled = true;
                    cmbBaudrate.Enabled = true;
                    lblIPAddress.Enabled = false;
                    txtIPAddress.Enabled = false;
                    lblPortNo.Enabled = false;
                    txtPortNo.Enabled = false;
                    lblPassword.Enabled = false;
                    txtPassword.Enabled = false;
                }
                else if (optNetworkDevice.Checked)
                {
                    lblComPort.Enabled = false;
                    cmbComPort.Enabled = false;
                    lblBaudrate.Enabled = false;
                    cmbBaudrate.Enabled = false;
                    lblIPAddress.Enabled = true;
                    txtIPAddress.Enabled = true;
                    lblPortNo.Enabled = true;
                    txtPortNo.Enabled = true;
                    lblPassword.Enabled = true;
                    txtPassword.Enabled = true;
                    lpszIPAddress = txtIPAddress.Text;
                }
                else
                {
                    lblComPort.Enabled = false;
                    cmbComPort.Enabled = false;
                    lblBaudrate.Enabled = false;
                    cmbBaudrate.Enabled = false;
                    lblIPAddress.Enabled = false;
                    txtIPAddress.Enabled = false;
                    lblPortNo.Enabled = false;
                    txtPortNo.Enabled = false;
                    lblPassword.Enabled = false;
                    txtPassword.Enabled = false;
                }
            }
        }

        private void cmdProuctCode_Click(object sender, EventArgs e)
        {
            frmPrtCode frm_prtcode = new frmPrtCode();
            frm_prtcode.Activate();
            frm_prtcode.Visible = true;
            this.Visible = false;
        }

        private void cmdExit_Click(object sender, EventArgs e)
        {
           if (mOpenFlag) 
               BioTime.Disconnect();
            Close();
        }

        private void frmMain_FormClosed(object sender, FormClosedEventArgs e)
        {

        }

        private void cmdSystemInfo_Click(object sender, EventArgs e)
        {
            frmSystemInfo frm_SystemInfo = new frmSystemInfo();
            frm_SystemInfo.Activate();
            frm_SystemInfo.Visible = true;
            this.Visible = false;
        }

        private void cmdLockCtl_Click(object sender, EventArgs e)
        {
            frmLockCtrl frm_lockctrl = new frmLockCtrl();
            frm_lockctrl.Activate();
            frm_lockctrl.Visible = true;
            this.Visible = false;
        }

        private void cmdBellInfo_Click(object sender, EventArgs e)
        {
            frmBellInfo frm_BellInfo = new frmBellInfo();
            frm_BellInfo.Activate();
            frm_BellInfo.Visible = true;
            this.Visible = false;
        }

        private void cmdLogData_Click(object sender, EventArgs e)
        {
            frmLog frm_log = new frmLog();
            frm_log.Activate();
            frm_log.Visible = true;
            this.Visible = false;
        }

        private void cmdEnrollData_Click(object sender, EventArgs e)
        {
            frmEnroll frm_enroll = new frmEnroll();
            frm_enroll.Activate();
            frm_enroll.Visible = true;
            this.Visible = false;
        }

        private void cmdScreenSaver_Click(object sender, EventArgs e)
        {
            frmScreenSaver frm_screen_saver = new frmScreenSaver();
            frm_screen_saver.Activate();
            frm_screen_saver.Visible = true;
            this.Visible = false;
        }

        private void cmdDepartment_Click(object sender, EventArgs e)
        {
            frmDepartment frm_department = new frmDepartment();
            frm_department.Activate();
            frm_department.Visible = true;
            this.Visible = false;
        }

        private void cmdProxy_Click(object sender, EventArgs e)
        {
            frmDaigong frm_proxy = new frmDaigong();
            frm_proxy.Activate();
            frm_proxy.Visible = true;
            this.Visible = false;
        }

        private void cmdLogTz_Click(object sender, EventArgs e)
        {
            frmTrMode frm_trmode = new frmTrMode();
            frm_trmode.Activate();
            frm_trmode.Visible = true;
            this.Visible = false;
        }

        private void cmdAccessTz_Click(object sender, EventArgs e)
        {
            frmAccessTz frm_accesstz = new frmAccessTz();
            frm_accesstz.Activate();
            frm_accesstz.Visible = true;
            this.Visible = false;
        }

        private void BioTime_OnReceiveEventXML(object sender, AxSBXPCLib._DSBXPCEvents_OnReceiveEventXMLEvent e)
        {
            frm_event.ReceiveEvent(e.lpszEventXML);
        }

        private void cmdEventMoniter_Click(object sender, EventArgs e)
        {
            frm_event.Activate();
            frm_event.Visible = true;
            this.Visible = false;
        }

        private void frmMain_FormClosing(object sender, FormClosingEventArgs e)
        {
            frm_event.Close();
        }

        private void Frame4_Enter(object sender, EventArgs e)
        {

        }
    }
}
