using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Text;
using System.Windows.Forms;
using System.Threading;

namespace LogServerApp
{
    public partial class MainForm : Form
    {
        public delegate void delegateAppendMessage(string message);
        public delegateAppendMessage theDelegateAppendMessage;
		
		public static MainForm theForm;	// Global form object

        LogServer theLogServer;	// Log server
		Boolean stopping;		// Is stopping?
		ManualResetEvent stoppedEvent;//stop event

		enum ThreadState { RUNNING, STOPPED };
		ThreadState watchState;
		
        public MainForm()
        {
            InitializeComponent();

			// Initialize objects
			theDelegateAppendMessage = new delegateAppendMessage(AppendMessage);
			theForm = this;
			watchState = ThreadState.STOPPED;
        }

		// Append a message into list
		public void AppendMessage(string message)
        {
            lstEvents.Items.Add(message);
        }

        private void cmdClear_Click(object sender, EventArgs e)
        {
			lstEvents.Items.Clear();	// Clear log list
        }

        private void MainForm_FormClosing(object sender, FormClosingEventArgs e)
        {
			if (watchState != ThreadState.STOPPED)
				StopWatchEventThread();
        }

		private void WatchEventThread(object state)
		{
			Int16 portNum = Convert.ToInt16(txtPortNum.Text);	// Get port number.

			theLogServer = new LogServer(portNum);	// Create and start log server.

			// Watch stop signal.
			while (!this.stopping)
			{
				Thread.Sleep(100);  // Simulate some lengthy operations.
			}

			theLogServer.Dispose();	// Dispose log server
			this.stoppedEvent.Set();// Signal the stopped event.
		}

		private void StartWatchEventThread()
		{
			this.stopping = false;
			this.stoppedEvent = new ManualResetEvent(false);

			if (ThreadPool.QueueUserWorkItem(new WaitCallback(WatchEventThread)))
				watchState = ThreadState.RUNNING;
		}

		private void StopWatchEventThread()
		{
			this.stopping = true;
			this.stoppedEvent.WaitOne();

			watchState = ThreadState.STOPPED;
		}

		private void cmdStart_Click(object sender, EventArgs e)
		{
			// Render controls.
			cmdStart.Enabled = false;
			cmdStop.Enabled = true;
			txtPortNum.Enabled = false;

			StartWatchEventThread();// Start thread.
		}

		private void cmdStop_Click(object sender, EventArgs e)
		{
			StopWatchEventThread();	// Stop thread.

			// Render controls.
			cmdStart.Enabled = true;
			cmdStop.Enabled = false;
			txtPortNum.Enabled = true;
		}

        private void MainForm_Load(object sender, EventArgs e)
        {

        }
    }
}
