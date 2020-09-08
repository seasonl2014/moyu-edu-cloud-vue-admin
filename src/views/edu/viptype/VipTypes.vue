<template>
  <div id="vipTypes">
    <!-- 面包导航 -->
    <el-breadcrumb separator="/" style="padding-left:10px;padding-bottom:10px;font-size:12px;">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>教育管理</el-breadcrumb-item>
      <el-breadcrumb-item>会员类型</el-breadcrumb-item>
    </el-breadcrumb>
    <!-- 右侧卡片区域 -->
    <!-- 用户列表卡片区 -->
    <el-card class="box-card">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input
            clearable
            v-model="queryMap.name"
            placeholder="请输入会员类型查询"
            @clear="search"
            class="input-with-select"
          >
            <el-button slot="append" icon="el-icon-search" @click="search"></el-button>
          </el-input>
        </el-col>
        <el-col :span="2">
          <el-button
            v-hasPermission="'vipType:add'"
            type="success"
            icon="el-icon-circle-plus-outline"
            @click="addDialogVisible=true"
          >添加</el-button>
        </el-col>
      </el-row>
      <!-- 表格区域 -->
      <template>
        <el-table
          border
          v-loading="loading"
          stripe
          :data="vipTypeData"
          style="width: 100%;margin-top:20px;"
          height="460"
        >
          <el-table-column prop="id" type="index" label="ID" width="50"></el-table-column>
          <el-table-column prop="name" label="会员类型名" width="160"></el-table-column>
          <el-table-column prop="total" label="会员人数" sortable width="120">
            <template slot-scope="scope">
              <el-tag effect="plain" v-text="scope.row.memberTotal+'人'" size="mini">
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="vipMoney" label="会员价格" sortable width="120">
            <template slot-scope="scope">
              <el-tag effect="plain" v-text="'￥'+scope.row.vipMoney" size="mini">
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="subjectList" label="会员权益" sortable>
            <template slot-scope="scope">
              <el-tag effect="plain" v-for="(item,i) in scope.row.subjectList" v-text="item.name" size="mini">
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="gmtCreate" label="创建时间" sortable></el-table-column>
          <el-table-column prop="gmtModified" label="修改时间" sortable></el-table-column>
          <el-table-column label="操作">
            <template slot-scope="scope">
              <el-button
                v-hasPermission="'vipType:edit'"
                type="text"
                size="mini"
                title="编辑会员类型"
                icon="el-icon-edit"
                @click="edit(scope.row.id)"
              >编辑</el-button>

              <el-button
                v-hasPermission="'vipType:delete'"
                type="text"
                size="mini"
                title="删除会员类型"
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
      <!-- 会员类型别添加弹出框 -->
      <el-dialog  title="添加会员类型" :visible.sync="addDialogVisible" width="50%" @close="closeAddDialog">
        <span>
          <el-form
            :model="addRuleForm"
            :rules="addRules"
            ref="addRuleFormRef"
            label-width="100px"
            class="demo-ruleForm"
          >
            <el-form-item label="会员名称" prop="name">
              <el-input v-model="addRuleForm.name"></el-input>
            </el-form-item>
             <el-form-item label="会员价格" prop="vipMoney">
              <el-input-number v-model="addRuleForm.vipMoney"></el-input-number>
            </el-form-item>
          </el-form>
        </span>
        <span slot="footer" class="dialog-footer">
          <el-button @click="addDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="add" :disabled="btnDisabled" :loading="btnLoading">确 定</el-button>
        </span>
      </el-dialog>

      <!-- 会员类型别编辑弹出框 -->
      <el-dialog
        title="更新会员类型"
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
            <el-form-item label="会员名称" prop="name">
              <el-input v-model="editRuleForm.name"></el-input>
            </el-form-item>
            <el-form-item label="会员价格" prop="vipMoney">
              <el-input v-model="editRuleForm.vipMoney"></el-input>
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
export default {
  data() {
    return {
      btnLoading: false,
      btnDisabled: false,
      loading: true,
      editDialogVisible: false,
      addDialogVisible: false, //添加弹框是否显示
      total: 0, //总共多少条数据
      vipTypeData: [], //表格数据
      queryMap: { pageNum: 1, pageSize: 7, name: "" }, //查询对象
      addRuleForm: {vipMoney:0}, //添加表单数据
      editRuleForm: {}, //修改表单数据
      deans: [], //所有会员类型主任
      addRules: {
        name: [
          { required: true, message: "请输入会员类型名称", trigger: "blur" },
          { min: 3, max: 10, message: "长度在 3 到 10 个字符", trigger: "blur" }
        ],
        address: [
          { required: true, message: "请输入办公地址", trigger: "blur" },
          { min: 4, max: 12, message: "长度在 4 到 12 个字符", trigger: "blur" }
        ]
      } //添加验证
    };
  },
  methods: {
    /**
     * 加载会员类型表格
     */
    downExcel() {
      var $this = this;
      const res = axios
        .request({
          url: "/system/vipType/excel",
          method: "post",
          responseType: "blob"
        })
        .then(res => {
          if (res.headers["content-type"] === "application/json") {
            return $this.$message.error(
              "Subject does not have permission [vipType:export]"
            );
          }
          const data = res.data;
          let url = window.URL.createObjectURL(data); // 将二进制文件转化为可访问的url
          var a = document.createElement("a");
          document.body.appendChild(a);
          a.href = url;
          a.download = "会员类型列表.xls";
          a.click();
          window.URL.revokeObjectURL(url);
        });
    },
    /**
     * 搜索会员类型
     */
    search() {
      this.queryMap.pageNum = 1;
      this.getvipTypeList();
    },
    /**
     * 删除会员类型
     */
    async del(id) {
      var res = await this.$confirm(
        "此操作将永久删除该用户, 是否继续?",
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
          "system/vipType/delete/" + id
        );
        if (res.code == 200) {
          this.$message.success("会员类型删除成功");
          this.getvipTypeList();
        } else {
          this.$message.error(res.msg);
        }
      }
    },
    /**
	 * 更新用户
	 */
    async update() {
      this.$refs.editRuleFormRef.validate(async valid => {
        if (!valid) {
          return;
        } else {
          (this.btnLoading = true), (this.btnDisabled = true);
          const { data: res } = await this.$http.put(
            "system/vipType/update/" + this.editRuleForm.id,
            this.editRuleForm
          );
          if (res.code == 200) {
            this.$notify({
              title: "成功",
              message: "会员类型信息更新",
              type: "success"
            });
            this.getvipTypeList();
          } else {
            this.$message.error("会员类型信息更新失败:" + res.msg);
          }
          this.editRuleForm = {};
          this.btnDisabled = false;
          this.btnLoading = false;
          this.editDialogVisible = false;
        }
      });
    },
    /**
	 * 编辑
	 * @param {Object} id
	 */
    async edit(id) {
      const { data: res } = await this.$http.get("eduservice/type/edit/" + id);
      if (res.code == 200) {
        this.editRuleForm = res.data;
      } else {
        return this.$message.error("会员类型信息编辑失败" + res.msg);
      }
      this.editDialogVisible = true;
    },
    //添加
    add() {
      this.$refs.addRuleFormRef.validate(async valid => {
        if (!valid) {
          return;
        } else {
          (this.btnLoading = true), (this.btnDisabled = true);
          const { data: res } = await this.$http.post(
            "eduservice/type/add",
            this.addRuleForm
          );
          if (res.code == 200) {
            this.$message.success("会员类型添加成功");
            this.addRuleForm = {};
            this.getvipTypeList();
          } else {
            return this.$message.error("会员类型添加失败:" + res.msg);
          }
          this.addDialogVisible = false;
          (this.btnLoading = false), (this.btnDisabled = false);
        }
      });
    },
    //加载会员类型别列表
    async getvipTypeList() {
      const { data: res } = await this.$http.get(
        "eduservice/type/findVipTypeList",
        {
          params: this.queryMap
        }
      );
      if (res.code !== 200) {
        return this.$message.error("获取用户列表失败");
      } else {
        this.total = res.data.total;
        this.vipTypeData = res.data.rows;
      }
    },
    //改变页码
    handleSizeChange(newSize) {
      this.queryMap.pageSize = newSize;
      this.getvipTypeList();
    },
    //翻页
    handleCurrentChange(current) {
      this.queryMap.pageNum = current;
      this.getvipTypeList();
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
    }
  },
  created() {
    this.getvipTypeList();
    setTimeout(() => {
      this.loading = false;
    }, 500);
  }
};
</script>
