using System;
using System.Collections.Generic;
//using System.Linq;
using System.Text;
using System.Data;
using System.Data.OleDb;
using System.Windows.Forms;

namespace SBXPCSampleCSharp
{
    public class EnrollData
    {
        string mDataPath;
        public static EnrollData DataModule;

        private OleDbConnection GetConnection()
        {
            return (new OleDbConnection("Provider=Microsoft.Jet.OLEDB.4.0;" + "Data Source=" + mDataPath + "datEnrollDat.mdb"));
        }

        public DataSet GetEnrollDatas()
        {
            return this.GetEnrollDatas("EnrollNumber");
        }

        public DataSet GetEnrollDatas(string sortfield)
        {
            OleDbConnection conn = GetConnection();
            try
            {
                DataSet ds = new DataSet();
                string sql = "select * from tblEnroll order by " + sortfield;
                OleDbDataAdapter da = new OleDbDataAdapter(sql, conn);
                try
                {
                    da.Fill(ds, "tblEnroll");
                }
                finally
                {
                    da.Dispose();
                }
                return ds;
            }
            finally
            {
                conn.Close();
                conn.Dispose();
            }
        }

        public DataSet GetEnrollData(ref int id)
        {
            OleDbConnection conn = GetConnection();
            try
            {
                string sql = "select * from tblEnroll where EnrollNumber = " + Convert.ToString(id);
                OleDbDataAdapter da = new OleDbDataAdapter(sql, conn);
                DataSet ds = new DataSet();
                try
                {
                    da.Fill(ds, "tblEnroll");
                }
                finally
                {
                    da.Dispose();
                }
                return ds;
            }
            finally
            {
                conn.Close();
                conn.Dispose();
            }
        }

        public DataSet DeleteDB()
        {
            OleDbConnection conn = GetConnection();

            try
            {
                string sql = "Select * from tblEnroll";
                OleDbDataAdapter da = new OleDbDataAdapter(sql, conn);
                DataSet ds = new DataSet();
                try
                {
                    da.Fill(ds, "tblEnroll");

                    foreach (DataRow dbRow in ds.Tables[0].Rows)
                    {
                        dbRow.Delete();
                    }
                }
                finally
                {
                    da.Dispose();
                }
                return ds;
            }
            finally
            {
                conn.Close();
                conn.Dispose();
            }
        }

        public DataSet GetNewEnroll()
        {
            OleDbConnection conn = GetConnection();

            try
            {
                string sql = "Select * from tblEnrolls where EnrollNumber = -1";
                OleDbDataAdapter da = new OleDbDataAdapter(sql, conn);
                DataSet ds = new DataSet();

                try
                {
                    da.Fill(ds, "tblEnrolls");   // returns an empty dataset but with the correct structure
                    DataRow dr = ds.Tables[0].NewRow();   // creates a new blank row
                    ds.Tables[0].Rows.Add(dr);   // add the blank row to the dataset
                }
                finally
                {
                    da.Dispose();
                }
                return ds;  // return the dataset containing one new, blank pupil
            }
            finally
            {
                conn.Close();
                conn.Dispose();
            }
        }

        public void SaveEnrolls(DataSet ds)
        {
            OleDbConnection conn = GetConnection();

            try
            {
                string sql = "select * from tblEnroll";
                OleDbDataAdapter da = new OleDbDataAdapter(sql, conn);

                try
                {
                    OleDbCommandBuilder cb = new OleDbCommandBuilder(da);

                    if (ds.HasChanges())
                    {
                        da.Update(ds, "tblEnroll");
                        ds.AcceptChanges();
                    }
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Error at SaveEnrolls IF " + ex.ToString());
                }
                finally
                {
                    da.Dispose();
                    ds.Dispose();
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error at SaveEnrolls " + ex.ToString());
            }
            finally
            {
                conn.Close();
                conn.Dispose();
            }



        }

        public void SaveEnroll(DataSet ds)
        {
            //Update a dataset representing enroll data
            OleDbConnection conn = GetConnection();

            try
            {
                string sql = "Select * from tblEnroll";
                OleDbDataAdapter da = new OleDbDataAdapter(sql, conn);

                try
                {
                    OleDbCommandBuilder cb = new OleDbCommandBuilder(da);
                    if (ds.HasChanges())
                    {
                        da.Update(ds, "tblEnroll");
                        ds.AcceptChanges();
                    }
                }
                finally
                {
                    da.Dispose();
                }
            }
            finally
            {
                conn.Close();
                conn.Dispose();
            }
        }
        public void New(string sDatapath)
        {
            this.mDataPath = sDatapath;
            EnrollData.DataModule = this;
        }
    }
}
