namespace LogServerApp
{
    partial class MainForm
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.lstEvents = new System.Windows.Forms.ListBox();
            this.cmdClear = new System.Windows.Forms.Button();
            this.cmdStart = new System.Windows.Forms.Button();
            this.cmdStop = new System.Windows.Forms.Button();
            this.lblPortNum = new System.Windows.Forms.Label();
            this.txtPortNum = new System.Windows.Forms.TextBox();
            this.SuspendLayout();
            // 
            // lstEvents
            // 
            this.lstEvents.Font = new System.Drawing.Font("Tahoma", 9.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lstEvents.FormattingEnabled = true;
            this.lstEvents.HorizontalExtent = 2000;
            this.lstEvents.HorizontalScrollbar = true;
            this.lstEvents.ItemHeight = 16;
            this.lstEvents.Location = new System.Drawing.Point(12, 13);
            this.lstEvents.Name = "lstEvents";
            this.lstEvents.Size = new System.Drawing.Size(860, 548);
            this.lstEvents.TabIndex = 77;
            // 
            // cmdClear
            // 
            this.cmdClear.BackColor = System.Drawing.SystemColors.Control;
            this.cmdClear.Cursor = System.Windows.Forms.Cursors.Default;
            this.cmdClear.Font = new System.Drawing.Font("Tahoma", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.cmdClear.ForeColor = System.Drawing.SystemColors.ControlText;
            this.cmdClear.Location = new System.Drawing.Point(810, 593);
            this.cmdClear.Name = "cmdClear";
            this.cmdClear.RightToLeft = System.Windows.Forms.RightToLeft.No;
            this.cmdClear.Size = new System.Drawing.Size(62, 30);
            this.cmdClear.TabIndex = 78;
            this.cmdClear.Text = "Clear";
            this.cmdClear.UseVisualStyleBackColor = false;
            this.cmdClear.Click += new System.EventHandler(this.cmdClear_Click);
            // 
            // cmdStart
            // 
            this.cmdStart.BackColor = System.Drawing.SystemColors.Control;
            this.cmdStart.Cursor = System.Windows.Forms.Cursors.Default;
            this.cmdStart.Font = new System.Drawing.Font("Tahoma", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.cmdStart.ForeColor = System.Drawing.SystemColors.ControlText;
            this.cmdStart.Location = new System.Drawing.Point(257, 593);
            this.cmdStart.Name = "cmdStart";
            this.cmdStart.RightToLeft = System.Windows.Forms.RightToLeft.No;
            this.cmdStart.Size = new System.Drawing.Size(149, 30);
            this.cmdStart.TabIndex = 79;
            this.cmdStart.Text = "Start";
            this.cmdStart.UseVisualStyleBackColor = false;
            this.cmdStart.Click += new System.EventHandler(this.cmdStart_Click);
            // 
            // cmdStop
            // 
            this.cmdStop.BackColor = System.Drawing.SystemColors.Control;
            this.cmdStop.Cursor = System.Windows.Forms.Cursors.Default;
            this.cmdStop.Enabled = false;
            this.cmdStop.Font = new System.Drawing.Font("Tahoma", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.cmdStop.ForeColor = System.Drawing.SystemColors.ControlText;
            this.cmdStop.Location = new System.Drawing.Point(412, 593);
            this.cmdStop.Name = "cmdStop";
            this.cmdStop.RightToLeft = System.Windows.Forms.RightToLeft.No;
            this.cmdStop.Size = new System.Drawing.Size(149, 30);
            this.cmdStop.TabIndex = 80;
            this.cmdStop.Text = "Stop";
            this.cmdStop.UseVisualStyleBackColor = false;
            this.cmdStop.Click += new System.EventHandler(this.cmdStop_Click);
            // 
            // lblPortNum
            // 
            this.lblPortNum.AutoSize = true;
            this.lblPortNum.Font = new System.Drawing.Font("Tahoma", 12F);
            this.lblPortNum.Location = new System.Drawing.Point(75, 596);
            this.lblPortNum.Name = "lblPortNum";
            this.lblPortNum.Size = new System.Drawing.Size(44, 19);
            this.lblPortNum.TabIndex = 81;
            this.lblPortNum.Text = "Port:";
            // 
            // txtPortNum
            // 
            this.txtPortNum.Font = new System.Drawing.Font("Tahoma", 12F);
            this.txtPortNum.Location = new System.Drawing.Point(122, 593);
            this.txtPortNum.Name = "txtPortNum";
            this.txtPortNum.Size = new System.Drawing.Size(100, 27);
            this.txtPortNum.TabIndex = 82;
            this.txtPortNum.Text = "5005";
            // 
            // MainForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(884, 641);
            this.Controls.Add(this.txtPortNum);
            this.Controls.Add(this.lblPortNum);
            this.Controls.Add(this.cmdStop);
            this.Controls.Add(this.cmdStart);
            this.Controls.Add(this.cmdClear);
            this.Controls.Add(this.lstEvents);
            this.Name = "MainForm";
            this.Text = "Log Server";
            this.FormClosing += new System.Windows.Forms.FormClosingEventHandler(this.MainForm_FormClosing);
            this.Load += new System.EventHandler(this.MainForm_Load);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.ListBox lstEvents;
        public System.Windows.Forms.Button cmdClear;
		public System.Windows.Forms.Button cmdStart;
		public System.Windows.Forms.Button cmdStop;
		private System.Windows.Forms.Label lblPortNum;
		private System.Windows.Forms.TextBox txtPortNum;


    }
}

