<template>
  <div id="departments">
    <!-- 面包导航 -->
    <el-breadcrumb separator="/" style="padding-left:10px;padding-bottom:10px;font-size:12px;">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>教育管理</el-breadcrumb-item>
      <el-breadcrumb-item>讲师管理</el-breadcrumb-item>
    </el-breadcrumb>
    <!-- 右侧卡片区域 -->
    <!-- 用户列表卡片区 -->
    <el-card class="box-card">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input
            clearable
            v-model="queryMap.name"
            placeholder="请输入讲师查询"
            @clear="search"
            class="input-with-select"
          >
            <el-button slot="append" icon="el-icon-search" @click="search"></el-button>
          </el-input>
        </el-col>
        <el-col :span="2">
          <el-button
            v-hasPermission="'department:add'"
            type="success"
            icon="el-icon-circle-plus-outline"
            @click="addDialogVisible=true"
          >添加</el-button>
        </el-col>
        <el-col :span="2">
          <el-button
            icon="el-icon-download"
            v-hasPermission="'department:export'"
            @click="downExcel"
          >导出</el-button>
        </el-col>
      </el-row>
      <!-- 表格区域 -->
      <template>
        <el-table
          border
          v-loading="loading"
          stripe
          :data="departmentData"
          style="width: 100%;margin-top:20px;"
          height="460"
        >
          <el-table-column prop="id" type="index" label="序号" width="50"></el-table-column>
          <el-table-column label="讲师头像" width="120">
            <template slot-scope="scope">
              <img class="avatar" :src="scope.row.avatar" alt="scope.row.name" width="150px">
            </template>
          </el-table-column>
          <el-table-column prop="name" label="讲师名称" width="120"></el-table-column>
          <el-table-column label="头衔" width="120">
            <template slot-scope="scope">
              {{ scope.row.level===1?'高级讲师':'首席讲师' }}
            </template>
          </el-table-column>
          <el-table-column prop="gmtCreate" label="添加时间" width="160"/>
          <el-table-column prop="sort" label="排序" width="120" />
          <el-table-column label="操作">
            <template slot-scope="scope">
              <el-button
                v-hasPermission="'teacher:edit'"
                type="text"
                size="mini"
                icon="el-icon-edit"
                @click="edit(scope.row.id)"
              >编辑</el-button>

              <el-button
                v-hasPermission="'teacher:delete'"
                type="text"
                size="mini"
                icon="el-icon-delete"
                @click="del(scope.row.id)"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <!-- 分页 -->
      <el-pagination
        style="margin-top:10px;"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="this.queryMap.pageNum"
        :page-sizes="[7, 10, 15, 20]"
        :page-size="this.queryMap.pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
      ></el-pagination>
      <!-- 讲师添加弹出框 -->
      <el-dialog @open="getDeanList" title="添加讲师" :visible.sync="addDialogVisible" width="50%" @close="closeAddDialog">
        <span>
          <el-form
            :model="addRuleForm"
            :rules="addRules"
            ref="addRuleFormRef"
            label-width="100px"
            class="demo-ruleForm"
          >
            <el-form-item label="讲师名称" prop="name">
              <el-input v-model="addRuleForm.name"></el-input>
            </el-form-item>
            <el-form-item label="讲师排序">
              <el-input-number v-model="addRuleForm.sort" controls-position="right" :min="0"/>
           </el-form-item>
            <el-form-item label="讲师头衔">
               <el-select v-model="addRuleForm.level" clearable placeholder="请选择">
            <!--
              数据类型一定要和取出的json中的一致，否则没法回填
              因此，这里value使用动态绑定的值，保证其数据类型是number
            -->
                <el-option :value="1" label="高级讲师"/>
                <el-option :value="2" label="首席讲师"/>
              </el-select>
            </el-form-item>
            <el-form-item label="讲师资历" prop="career">
              <el-input type="textarea" v-model="addRuleForm.career"></el-input>
            </el-form-item>

             <el-form-item label="讲师简介">
                <el-input v-model="addRuleForm.intro" :rows="10" type="textarea"/>
              </el-form-item>

            <!-- 讲师头像：TODO -->
            <el-form-item label="讲师头像">

            <!-- 头衔缩略图 -->
            <pan-thumb :image="addRuleForm.avatar"/>
        <!-- 文件上传按钮 -->
            <el-button type="primary" icon="el-icon-upload" @click="imagecropperShow=true">更换头像
            </el-button>

              <!-- v-show：是否显示上传组件
                  :key：类似于id，如果一个页面多个图片上传控件，可以做区分
                  :url：后台上传的url地址
                  @close：关闭上传组件
                  @crop-upload-success：上传成功后的回调 -->
                  <image-cropper
                          v-show="imagecropperShow"
                          :width="300"
                          :height="300"
                          :key="imagecropperKey"
                          :url="BASE_API+'/eduservice/oss/upload'"
                          field="file"
                          @close="close"
                          @crop-upload-success="cropSuccess"/>

            </el-form-item>


          </el-form>
        </span>
        <span slot="footer" class="dialog-footer">
          <el-button @click="addDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="add" :disabled="btnDisabled" :loading="btnLoading">确 定</el-button>
        </span>
      </el-dialog>

      <!-- 讲师别编辑弹出框 -->
      <el-dialog
              @open="getDeanList"
        title="更新讲师"
        :visible.sync="editDialogVisible"
        width="50%"
        @close="closeEditDialog"
      >
        <span>
          <el-form
            :model="editRuleForm"
            :rules="addRules"
            ref="editRuleFormRef"
            label-width="100px"
            class="demo-ruleForm"
          >
            <el-form-item label="讲师名称" prop="name">
              <el-input v-model="editRuleForm.name"></el-input>
            </el-form-item>
             <el-form-item label="讲师排序">
                <el-input-number v-model="editRuleForm.sort" controls-position="right" :min="0"/>
              </el-form-item>

             <el-form-item label="讲师头衔">
                <el-select v-model="editRuleForm.level" clearable placeholder="请选择">
                  <!--
                    数据类型一定要和取出的json中的一致，否则没法回填
                    因此，这里value使用动态绑定的值，保证其数据类型是number
                  -->
                  <el-option :value="1" label="高级讲师"/>
                  <el-option :value="2" label="首席讲师"/>
                </el-select>
              </el-form-item>

              <el-form-item label="讲师资历">
                <el-input v-model="editRuleForm.career"/>
              </el-form-item>

               <el-form-item label="讲师简介">
                  <el-input v-model="editRuleForm.intro" :rows="10" type="textarea"/>
                </el-form-item>

            <!-- 讲师头像：TODO -->
              <el-form-item label="讲师头像">

                <!-- 头衔缩略图 -->
                <pan-thumb :image="editRuleForm.avatar"/>
                        <!-- 文件上传按钮 -->
                <el-button type="primary" icon="el-icon-upload" @click="imagecropperShow=true">更换头像
                </el-button>

                        <!-- v-show：是否显示上传组件
                                :key：类似于id，如果一个页面多个图片上传控件，可以做区分
                                :url：后台上传的url地址
                                @close：关闭上传组件
                                @crop-upload-success：上传成功后的回调 -->
                <image-cropper
                        v-show="imagecropperShow"
                        :width="300"
                        :height="300"
                        :key="imagecropperKey"
                        :url="BASE_API+'eduservice/oss/upload'"
                        field="file"
                        @close="close"
                        @crop-upload-success="cropSuccess"/>

              </el-form-item>

          </el-form>
        </span>
        <span slot="footer" class="dialog-footer">
          <el-button @click="editDialogVisible = false">取 消</el-button>
          <el-button
            type="primary"
            @click="update"
            :disabled="btnDisabled"
            :loading="btnLoading"
          >确 定</el-button>
        </span>
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
import axios from "axios";
import ImageCropper from '@/components/ImageCropper'
import PanThumb from '@/components/PanThumb'
export default {
  //声明使用额外组件
  components: {
    ImageCropper,
    PanThumb
  },
  data() {
    var checkPhone = (rule, value, callback) => {
      const phoneReg = /^1[34578]\d{9}$$/;
      if (!value) {
        return callback(new Error("电话号码不能为空"));
      }
      setTimeout(() => {
        if (!Number.isInteger(+value)) {
          callback(new Error("请输入数字值"));
        } else {
          if (phoneReg.test(value)) {
            callback();
          } else {
            callback(new Error("电话号码格式不正确"));
          }
        }
      }, 100);
    };
    return {
      BASE_API: process.env.VUE_APP_BASE_API, // 接口API地址
      imagecropperKey: 0, // 上传组件id
      imagecropperShow: false, // 是否显示上传组件
      btnLoading: false,
      btnDisabled: false,
      loading: true,
      editDialogVisible: false,
      addDialogVisible: false, //添加弹框是否显示
      total: 0, //总共多少条数据
      departmentData: [], //表格数据
      queryMap: { pageNum: 1, pageSize: 7, name: "" }, //查询对象
      addRuleForm: {
        // 设置默认头像
        avatar: 'http://java.goodym.cn/touxiang.png'
      }, //添加表单数据
      editRuleForm: {}, //修改表单数据
      deans: [], //所有讲师主任
      addRules: {
        name: [
          { required: true, message: "请输入讲师名称", trigger: "blur" },
          { min: 3, max: 10, message: "长度在 3 到 10 个字符", trigger: "blur" }
        ],
        address: [
          { required: true, message: "请输入办公地址", trigger: "blur" },
          { min: 4, max: 12, message: "长度在 4 到 12 个字符", trigger: "blur" }
        ],
        mgrId: [{ required: true, message: "请选择讲师主任", trigger: "blur" }],
        phone: [
          {
            required: true,
            message: "请输入联讲师方式",
            validator: checkPhone,
            trigger: "blur"
          }
        ]
      } //添加验证
    };
  },
  methods: {
    /**
     * 导出讲师表格
     */
    downExcel() {
      var $this = this;
      const res = axios
        .request({
          url: "/system/department/excel",
          method: "post",
          responseType: "blob"
        })
        .then(res => {
          if (res.headers["content-type"] === "application/json") {
            return $this.$message.error(
              "Subject does not have permission [department:export]"
            );
          }
          const data = res.data;
          let url = window.URL.createObjectURL(data); // 将二进制文件转化为可访问的url
          var a = document.createElement("a");
          document.body.appendChild(a);
          a.href = url;
          a.download = "讲师列表.xls";
          a.click();
          window.URL.revokeObjectURL(url);
        });
    },
    /**
     * 搜索讲师
     */
    search() {
      this.queryMap.pageNum = 1;
      this.getTeacherList();
    },
    /**
     * 删除讲师
     */
    async del(id) {
      var res = await this.$confirm(
        "此操作将永久删除该讲师, 是否继续?",
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        }
      ).catch(() => {
        this.$message({
          type: "info",
          message: "已取消删除"
        });
      });
      if (res == "confirm") {
        const { data: res } = await this.$http.delete(
          "eduservice/teacher/delete/" + id
        );
        if (res.code == 200) {
          this.$message.success("讲师删除成功");
          this.getTeacherList();
        } else {
          this.$message.error(res.msg);
        }
      }
    },
    /**
	 * 更新讲师
	 */
    async update() {
      this.$refs.editRuleFormRef.validate(async valid => {
        if (!valid) {
          return;
        } else {
          (this.btnLoading = true), (this.btnDisabled = true);
          const { data: res } = await this.$http.put(
            "eduservice/teacher/update/" + this.editRuleForm.id,
            this.editRuleForm
          );
          if (res.code == 200) {
            this.$notify({
              title: "成功",
              message: "讲师信息更新",
              type: "success"
            });
            this.getTeacherList();
          } else {
            this.$message.error("讲师信息更新失败:" + res.msg);
          }
          this.editRuleForm = {};
          this.btnDisabled = false;
          this.btnLoading = false;
          this.editDialogVisible = false;
        }
      });
    },
    /**
	 * 编辑 讲师
	 * @param {Object} id
	 */
    async edit(id) {
      const { data: res } = await this.$http.get("eduservice/teacher/edit/" + id);
      if (res.code == 200) {
        this.editRuleForm = res.data;
      } else {
        return this.$message.error("讲师信息编辑失败" + res.msg);
      }
      this.editDialogVisible = true;
    },
    //添加 讲师
    add() {
      this.$refs.addRuleFormRef.validate(async valid => {
        if (!valid) {
          return;
        } else {
          (this.btnLoading = true), (this.btnDisabled = true);
          const { data: res } = await this.$http.post(
            "eduservice/teacher/add",
            this.addRuleForm
          );
          if (res.code == 200) {
            this.$message.success("讲师添加成功");
            this.addRuleForm = {};
            this.getTeacherList();
          } else {
            return this.$message.error("讲师添加失败:" + res.msg);
          }
          this.addDialogVisible = false;
          (this.btnLoading = false), (this.btnDisabled = false);
        }
      });
    },
    //加载讲师列表
    async getTeacherList() {
      const { data: res } = await this.$http.get(
        "eduservice/teacher/findEduTeacherList",
        {
          params: this.queryMap
        }
      );
      if (res.code !== 200) {
        return this.$message.error("获取讲师列表失败");
      } else {
        this.total = res.data.total;
        this.departmentData = res.data.rows;
      }
    },
    //加载所有讲师主任
    async getDeanList() {
      const { data: res } = await this.$http.get("system/department/findDeanList");
      if (res.code !== 200) {
        return this.$message.error("获取讲师主任失败");
      } else {
        this.deans = res.data;
      }
    },
    //改变页码
    handleSizeChange(newSize) {
      this.queryMap.pageSize = newSize;
      this.getTeacherList();
    },
    //翻页
    handleCurrentChange(current) {
      this.queryMap.pageNum = current;
      this.getTeacherList();
    },
    //关闭弹出框
    closeAddDialog() {
      this.$refs.addRuleFormRef.clearValidate();
      this.addRuleForm = {};
    },
    //关闭弹出框
    closeEditDialog() {
      this.$refs.editRuleFormRef.clearValidate();
      this.editRuleForm = {};
    },
    // 上传成功后的回调函数
    cropSuccess(data) {
      console.info("上传头像成功回调数据：-------------"+data)
      this.imagecropperShow = false
      //获取后台返回图片地址，显示到页面中
      this.editRuleForm.avatar = data
      // 上传成功后，重新打开上传组件时初始化组件，否则显示上一次的上传结果
      this.imagecropperKey = this.imagecropperKey + 1
    },
    // 关闭上传组件
    close() {
      //点击x，关闭弹窗
      this.imagecropperShow = false
      // 上传成功后，重新打开上传组件时初始化组件，否则显示上一次的上传结果
      this.imagecropperKey = this.imagecropperKey + 1
    }
  },
  created() {
    this.getTeacherList();
    setTimeout(() => {
      this.loading = false;
    }, 500);
  }
};
</script>

<style scoped>
.avatar {
  width: 64px;
  height: 64px;
  overflow: hidden;
  border-radius:50%;
  -webkit-border-radius:50%;
  -moz-border-radius:50%;
}
</style>
