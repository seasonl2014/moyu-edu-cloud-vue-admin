<template>
    <div id="courseCategroys">
        <!-- 面包导航 -->
        <el-breadcrumb separator="/" style="padding-left:10px;padding-bottom:10px;font-size:12px;">
            <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>教育管理</el-breadcrumb-item>
            <el-breadcrumb-item>课程管理</el-breadcrumb-item>
        </el-breadcrumb>
        <!-- 右侧卡片区域 -->
        <el-card class="box-card">
            <el-container style="margin-bottom:20px;">
                <el-alert
                        show-icon
                        title="友情提示:  课程的分类只支持二级分类"
                        type="warning">
                </el-alert>
            </el-container>
            <el-row :gutter="6">
                <el-col :span="5">
                    <el-cascader
                            size="mini"
                            placeholder="请选择分类查询"
                            :change-on-select="true"
                            @change="selectChange"
                            v-model="categorykeys"
                            :props="searchSelectProps"
                            :options="catetorys"
                            clearable
                    ></el-cascader>
                </el-col>
                <el-col :span="6">
                    <el-input
                            clearable
                            size="mini"
                            v-model="queryMap.title"
                            placeholder="请输入课程名称查询"
                            @clear="search"
                            class="input-with-select"
                    ></el-input>
                </el-col>
                <el-col :span="8">
                    <el-button size="mini" type="primary" icon="el-icon-search" @click="search">查找</el-button>
                    <el-button size="mini" icon="el-icon-refresh-right" type="warning" @click="resetForm">重置</el-button>
                    <el-button size="mini" type="success" icon="el-icon-circle-plus-outline" @click="openAdd"
                               v-hasPermission="'course:add'">添加
                    </el-button>
                    <el-button size="mini" icon="el-icon-refresh" @click="getCourseList">刷新</el-button>
                </el-col>
            </el-row>

            <!-- 表格区域 -->
            <template>
                <el-table
                        size="mini"
                        v-loading="loading"
                        border
                        stripe
                        :data="courseData"
                        style="width: 100%;margin-top:20px;"
                        height="400"
                >
                    <el-table-column prop="id" type="index" label="ID"></el-table-column>

                    <el-table-column prop="cover" label="图片" align="center" width="150px" padding="0px">
                        <!--            <template slot-scope="scope">-->
                        <!--              <img-->
                        <!--                slot="error"-->
                        <!--                :src="'https://www.zykhome.club/'+scope.row.imageUrl"-->
                        <!--                alt-->
                        <!--                style="width: 55px;height:55px"-->
                        <!--              />-->
                        <!--            </template>-->
                        <template slot-scope="scope">
                            <el-popover placement="right" trigger="hover">
                                <img :src="scope.row.cover"
                                     style="height: 200px;width: 360px"/>
                                <img slot="reference" :src="scope.row.cover"
                                     :alt="scope.row.cover" style="height: 38px;width: 58px;cursor: pointer">
                            </el-popover>
                        </template>
                    </el-table-column>

                    <el-table-column prop="title" label="课程名称"></el-table-column>
                    <el-table-column label="课时" width="100">
                        <template slot-scope="scope">
                            <el-tag type="success" size="mini" closable v-text="scope.row.lessonNum"></el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="发布时间" align="center">
                        <template slot-scope="scope">
                            {{ scope.row.gmtModified.substr(0, 10) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="价格" width="100" align="center" >
                        <template slot-scope="scope">
                            {{ Number(scope.row.price) === 0 ? '免费' :
                            '¥' + scope.row.price.toFixed(2) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="status" label="课程状态" width="100" align="center" >
                        <template slot-scope="scope">
                            <el-tag :type="scope.row.status === 'Draft' ? 'primary' : 'success'">{{scope.row.status === 'Draft' ? '未发布' : '已发布'}}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="buyCount" label="付费学员" width="100" align="center" >
                        <template slot-scope="scope">
                            {{ scope.row.buyCount }}人
                        </template>
                    </el-table-column>
                    <el-table-column prop="buyCount" label="VIP学员" width="100" align="center" >
                        <template slot-scope="scope">
                            {{ scope.row.vipCount }}人
                        </template>
                    </el-table-column>
                    <el-table-column  label="创建时间">
                        <template slot-scope="scope">
                            {{ scope.row.gmtCreate.substr(0, 10) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作">
                        <template slot-scope="scope">
                            <el-button title="编辑课程"  v-hasPermission="'course:edit'" type="primary" size="mini" icon="el-icon-edit" @click="editCourse(scope.row.id)"></el-button>
                            <el-button title="删除课程" v-hasPermission="'course:delete'" type="danger" size="mini" icon="el-icon-delete" @click="delCourse(scope.row.id)"></el-button>
                            <el-button title="添加课程大纲"  v-hasPermission="'course:edit'" type="primary" size="mini" icon="el-icon-video-camera" @click="editSyllabus(scope.row.id)"></el-button>
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
                    :page-sizes="[5, 10, 15, 20]"
                    :page-size="this.queryMap.pageSize"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="total"
            ></el-pagination>
            <!-- 课程信息添加弹出框 -->
            <el-dialog :close-on-click-modal="false"  title="添加新课程" :visible.sync="addDialogVisible" width="50%" @close="closeAddDialog">
                <el-steps :active="1" process-status="wait" align-center style="margin-bottom: 40px;">
                    <el-step title="填写课程基本信息"/>
                    <el-step title="创建课程大纲"/>
                    <el-step title="提交审核"/>
                </el-steps>
                <span>
                  <el-form
                          size="mini"
                          :model="addRuleForm"
                          :rules="addRules"
                          ref="addRuleFormRef"
                          label-width="100px"
                          class="demo-ruleForm"
                  >
                     <el-form-item label="课程分类" prop="categoryKeys">
                      <el-cascader
                              :options="catetorys"
                              clearable
                              filterable
                              :props="selectProps"
                              v-model="addRuleForm.categoryKeys"
                      ></el-cascader>
                    </el-form-item>
                    <el-form-item label="课程名称" prop="title">
                      <el-input v-model="addRuleForm.title"></el-input>
                    </el-form-item>
                    <el-form-item label="课程封面" prop="cover">
                      <!-- 图片上传部分 -->
                      <el-upload
                              :action="uploadApi"
                              :class="{ disabled: uploadDisabled }"
                              list-type="picture-card"
                              :limit="limitcount"
                              :on-change="handleChange"
                              :on-remove="handleRemove"
                              accept="image/*"
                              :on-success="handleSuccess"
                              :headers="headerObject"
                              ref="upload"
                              :on-preview="handlePictureCardPreview"
                      >
                        <i class="el-icon-plus"></i>
                      </el-upload>
                    </el-form-item>
                    <el-row>
                      <el-col :span="12">
                        <div class="grid-content bg-purple-light">
                          <el-form-item label="课程价格" prop="price">
                            <el-input-number v-model="addRuleForm.price"></el-input-number>
                          </el-form-item>
                        </div>
                      </el-col>
                        <el-col :span="12">
                        <div class="grid-content bg-purple-light">
                          <el-form-item label="预计课时" prop="lessonNum">
                            <el-input-number v-model="addRuleForm.lessonNum" :min="1"  label="预计课时"></el-input-number>
                          </el-form-item>
                        </div>
                      </el-col>
                    </el-row>
                  </el-form>
                </span>
                <span slot="footer" class="dialog-footer">
                  <el-button :disabled="saveBtnDisabled" type="primary" @click="next">保存并下一步</el-button>
                </span>
            </el-dialog>
            <!-- 课程大纲创建弹出框 -->
            <el-dialog :close-on-click-modal="false"  title="创建课程大纲" :visible.sync="syllabusDialogVisible" width="78%" @close="closeAddSyllabusDialog">
                <el-steps :active="2" process-status="wait" align-center style="margin-bottom: 40px;">
                    <el-step title="填写课程基本信息"/>
                    <el-step title="创建课程大纲"/>
                    <el-step title="提交审核"/>
                </el-steps>
                <span>
                    <el-row :gutter="20">
                        <el-col :span="8">
                          <el-button type="warning"  icon="el-icon-circle-plus-outline" @click="openAddChapter" v-hasPermission="'chapter:add'">添加章</el-button>
                        </el-col>
                      </el-row>
                    <!-- 表格部分 -->
                    <zk-table
                      v-loading="loading"
                      style="margin-top:10px;"
                      ref="table"
                      border
                      stripe
                      show-index
                      :expand-type="false"
                      :selection-type="false"
                      sum-text="sum"
                      index-text="#"
                      :data="chapters"
                      :columns="columns"
                    >
                    <!-- 章节 -->
                    <template slot="lev" slot-scope="scope">
                      <el-tag v-if="scope.row.lev===1">大章</el-tag>
                      <el-tag type="success" v-else>小节</el-tag>
                    </template>
                        <!-- 是否免费 -->
                    <template slot="isFree" slot-scope="scope">
                      <el-tag v-if="scope.row.isFree===0">免费</el-tag>
                      <el-tag type="success" v-else-if="scope.row.isFree===1">收费</el-tag>
                    </template>
                     <!--格式化时长-->
                    <template slot="duration" slot-scope="scope">
                      <el-tag type="success" v-if="scope.row.duration!=0">{{scope.row.duration*1000 | formatDate}}</el-tag>
                    </template>

                    <!-- 阿里云视频点播源 -->
                    <template slot="videoSourceId" slot-scope="scope">
                      <el-tag v-if="scope.row.lev!=1&&scope.row.videoSourceId!=null"  @click="playVideoByVideoId(scope.row.videoSourceId)"  effect="dark" type="success" style="cursor: pointer;">播放</el-tag>
                         <el-tag v-if="scope.row.videoSourceId===null&&scope.row.lev!=1" effect="plain"  type="warning">未上传</el-tag>
                    </template>
                      <!-- 操作 -->
                    <template slot="caozuo" slot-scope="scope">
                      <el-button v-if="scope.row.lev===1" title="添加课程小节" v-hasPermission="'video:add'" type="primary" size="mini" icon="el-icon-circle-plus" @click="openAddVideo(scope.row.id)"></el-button>
                      <el-button v-if="scope.row.lev!=1" plain title="上传视频" v-hasPermission="'video:upload'" type="primary" size="mini" icon="el-icon-upload" @click="uploadVideoById(scope.row.id)"></el-button>
                      <el-button v-if="scope.row.lev===1" title="编辑章"  v-hasPermission="'video:edit'" type="primary" size="mini" icon="el-icon-edit" @click="openEditChapter(scope.row.id)"></el-button>
                      <el-button v-if="scope.row.lev!=1" plain title="编辑节"  v-hasPermission="'video:edit'" type="success" size="mini" icon="el-icon-edit" @click="openEditVideo(scope.row.id)"></el-button>
                      <el-button v-if="scope.row.lev===1" title="删除章" v-hasPermission="'video:delete'" type="danger" size="mini" icon="el-icon-delete" @click="delChapter(scope.row.id)"></el-button>
                      <el-button v-if="scope.row.lev!=1" plain title="删除节" v-hasPermission="'video:delete'" type="danger" size="mini" icon="el-icon-delete" @click="delVideo(scope.row.id)"></el-button>
                    </template>
                  </zk-table>
                    <!-- 分页 -->
                    <el-pagination
                          style="margin-top:10px;"
                          background

                          :show-header="true"
                          @size-change="handleChapterSizeChange"
                          @current-change="handleChapterCurrentChange"
                          :current-page="this.queryMap.pageNum"
                          :page-sizes="[5,10, 15, 20, 25,30]"
                          :page-size="this.queryMap.pageSize"
                          layout="total, sizes, prev, pager, next, jumper"
                          :total="total"
                  ></el-pagination>
                </span>
                <span slot="footer" class="dialog-footer">
                    <el-button :disabled="saveBtnDisabled" type="primary" @click="next">下一步</el-button>
                </span>
            </el-dialog>
            <!-- 添加章弹出框 addChapterDialogVisible-->
            <el-dialog
                    :title="titleChapter"
                    :visible.sync="addChapterDialogVisible"
                    width="50%"
                    @close="closeAddChapterDialog"
            >
                <span>
                  <el-form
                          size="mini"
                          :model="chapter"
                          :rules="addChapterRules"
                          ref="addChapterRuleFormRef"
                          label-width="100px"
                          class="demo-ruleForm"
                  >
                    <el-form-item label="章名称" prop="title">
                      <el-input v-model="chapter.title"></el-input>
                    </el-form-item>
                    <el-row>
                      <el-col :span="24">
                        <div class="grid-content bg-purple-light">
                          <el-form-item label="排序" prop="sort">
                            <el-input-number v-model="chapter.sort" :min="1" :max="10" label="排序"></el-input-number>
                          </el-form-item>
                        </div>
                      </el-col>
                    </el-row>
                  </el-form>
                </span>
                <span slot="footer" class="dialog-footer">
                <el-button
                          type="primary"
                          @click="addChapter"
                          :disabled="btnDisabled"
                          :loading="btnLoading"
                >确 定</el-button>
                </span>
            </el-dialog>
            <!-- 添加小节弹出框-->
            <el-dialog
                    :title="titleVideo"
                    :visible.sync="addVideoDialogVisible"
                    width="50%"
                    @close="closeAddVideoDialog"
            >
                <span>
                  <el-form
                          size="mini"
                          :model="video"
                          :rules="addVideoRules"
                          ref="addVideoRuleFormRef"
                          label-width="100px"
                          class="demo-ruleForm"
                  >
                    <el-form-item label="小节名称" prop="title">
                      <el-input v-model="video.title"></el-input>
                    </el-form-item>
                    <el-row>
                      <el-col :span="12">
                        <div class="grid-content bg-purple-light">
                          <el-form-item label="排序" prop="sort">
                            <el-input-number v-model="video.sort" :min="1" :max="50" label="排序"></el-input-number>
                          </el-form-item>
                        </div>
                      </el-col>
                         <el-col :span="12">
                        <div class="grid-content bg-purple-light">
                          <el-form-item label="是否免费" prop="isFree">
                              <el-radio v-model="video.isFree" :label="0">免费</el-radio>
                               <el-radio v-model="video.isFree" :label="1">收费</el-radio>
                          </el-form-item>
                        </div>
                      </el-col>
                    </el-row>
                  </el-form>
                </span>
                <span slot="footer" class="dialog-footer">
                <el-button
                        type="primary"
                        @click="addVideo"
                        :disabled="btnDisabled"
                        :loading="btnLoading"
                >确 定</el-button>
                </span>
            </el-dialog>

            <!-- 编辑课程弹出框-->
            <el-dialog
                    title="更新课程"
                    :visible.sync="editDialogVisible"
                    width="50%"
                    @close="closeEditDialog"
            >
        <span>
          <el-form
                  size="mini"
                  :model="editRuleForm"
                  :rules="addRules"
                  ref="editRuleFormRef"
                  label-width="100px"
                  class="demo-ruleForm"
          >
            <el-form-item label="课程名称" prop="title">
              <el-input v-model="editRuleForm.title"></el-input>
            </el-form-item>
            <el-form-item label="课程封面" prop="cover">
              <!-- 图片上传部分 -->
              <el-upload
                      :action="uploadApi"
                      :class="{ disabled: uploadDisabled }"
                      list-type="picture-card"
                      :limit="limitcount"
                      accept="image/*"
                      :on-success="editHandleSuccess"
                      :headers="headerObject"
                      ref="upload2"
                      :on-preview="handlePictureCardPreview"
                      :file-list="imgFilesList"
              >
                <i class="el-icon-plus"></i>
              </el-upload>
            </el-form-item>
            <el-row>
              <el-col :span="12">
                <el-form-item label="课程价格" prop="price">
                  <el-input-number v-model="editRuleForm.price"></el-input-number>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <div class="grid-content bg-purple">
                  <el-form-item label="分类" prop="categoryKeys">
                    <el-cascader
                            :options="catetorys"
                            clearable
                            filterable
                            :props="selectProps"
                            v-model="editRuleForm.categoryKeys"
                    ></el-cascader>
                  </el-form-item>
                </div>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="12">
                <div class="grid-content bg-purple">
                  <el-form-item label="预计课时" prop="lessonNum">
                    <el-input-number v-model="editRuleForm.lessonNum"></el-input-number>
                  </el-form-item>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="grid-content bg-purple-light">
                  <el-form-item label="课程难易" prop="difficulty">
                     <el-select v-model="editRuleForm.difficulty" placeholder="请选择">
                          <el-option
                                  v-for="item in difficultyOptions"
                                  :key="item.value"
                                  :label="item.label"
                                  :value="item.value"
                          ></el-option>
                    </el-select>
                  </el-form-item>
                </div>
              </el-col>
            </el-row>
          </el-form>
        </span>
                <span slot="footer" class="dialog-footer">
          <el-button @click="editDialogVisible = false">取 消</el-button>
          <el-button
                  type="primary"
                  @click="updateCourse"
                  :disabled="btnDisabled"
                  :loading="btnLoading"
          >确 定</el-button>
        </span>
            </el-dialog>
            <!-- 图片预览 -->
            <el-dialog :visible.sync="dialogVisible">
                <img width="100%" :src="dialogImageUrl" alt/>
            </el-dialog>
            <!--上传视频-->
            <el-dialog :visible.sync="dialogUploadVideoVisible" :title="video.title" center width="40%" :before-close="handleUploadVideoClose">
                <el-upload
                        ref="videoUpload"
                        :action="BASE_API+'vidservice/vod/uploadById'"
                        :data="video"
                        :before-upload="handleProgress"
                        :on-progress="fileOnProgress"
                        :limit="1"
                        class="upload-demo"
                        drag
                        :show-file-list="showFileList"
                        :on-success="FileOnSuccess"
                        multiple>
                    <i class="el-icon-upload"/>
                    <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
                    <div slot="tip" class="el-upload__tip">只能上传mp4文件，且不超过500mb</div>
                </el-upload>
                <!--进度条-->
                <el-progress v-show="showProgress" :text-inside="true" :stroke-width="24" :percentage="uploadPercent" status="success"></el-progress>
            </el-dialog>
            <!--点击预览视频-->
            <el-dialog :visible.sync="dialogVideoVisible" :title="video.title" :before-close="handleViewVideoClose">
                <div id="J_prismPlayer" class="prism-player"/>
            </el-dialog>
        </el-card>

    </div>
</template>
<script>
    import md5 from 'js-md5';
    import {formatDate} from '@/utils/filters'
    export default {
        data() {
            return {
                titleChapter: '添加章',
                titleVideo: '添加课时',
                difficultyOptions:[{
                    value: 0,
                    label: '入门'
                }, {
                    value: 1,
                    label: '初级'
                }, {
                    value: 2,
                    label: '中级'
                }, {
                    value: 3,
                    label: '高级'
                }],
                courseId: null, // 课程ID
                uploadPercent: 0,//上传视频进度比
                i: 0,
                // 定时器
                intervalId: '',
                showProgress: false, // 是否显示进度条
                showFileList: true, //是否显示已上传文件列表
                saveBtnDisabled: false, // 保存按钮是否禁用
                uploadApi: process.env.VUE_APP_BASE_API+'/eduservice/oss/upload',
                BASE_API: process.env.VUE_APP_BASE_API ,// 接口API地址
                btnLoading: false,
                btnDisabled: false,
                loading: true,
                chapters: [],// 章节列表
                chapter: {

                },// 章节对象
                player: '', // 视频播放器对象
                video: {
                    isFree: 0,
                    sort: 1,
                    fileKey: ''
                },// 小节对象
                headerObject: {
                    Authorization: window.localStorage.getItem("JWT_TOKEN")
                }, //图片上传请求头
                catetorys: [], //类别选择
                selectProps: {
                    expandTrigger: "hover",
                    value: "id",
                    label: "name",
                    children: "children",
                    checkStrictly: false
                }, //级联选择器配置项
                searchSelectProps: {
                    expandTrigger: "hover",
                    value: "id",
                    label: "name",
                    children: "children",
                    checkStrictly: true
                }, //级联搜索选择器配置项


                editDialogVisible: false,
                addDialogVisible: false, //添加弹框是否显示
                syllabusDialogVisible: false, // 创建课程大纲是否显示
                addChapterDialogVisible: false, // 添加章弹框是否显示
                addVideoDialogVisible: false, //添加小节弹框是否显示
                dialogUploadVideoVisible: false,//上传视频弹框是否显示
                dialogVideoVisible: false,// 预览播放器
                total: 0, //总共多少条数据
                courseData: [], //表格数据
                queryMap: {
                    pageNum: 1,
                    pageSize: 5,
                    title: "",
                    categoryId: "",
                    supplier: "",
                    status: "",

                }, //查询对象
                addRuleForm: {teacherId:2}, //添加表单数据
                editRuleForm: {}, //修改表单数据
                uploadDisabled: false,
                limitcount: 1,
                dialogImageUrl: "",
                dialogVisible: false,
                addRules: {
                    categorys: [
                        {required: true, message: "请输入课程分类", trigger: "blur"}
                    ],
                    sort: [{required: true, message: "请输入地址信息", trigger: "blur"}],
                    categoryKeys: [
                        {required: true, message: "请选择课程分类", trigger: "blur"}
                    ]
                }, //添加验证
                addChapterRules: {
                    title: [
                        {required: true, message: "请输入章节名称", trigger: "blur"},
                        {min: 2, max: 25, message: "长度在 2 到 25 个字符", trigger: "blur"}
                    ],
                    sort: [{required: true, message: "请输入课程章节排序", trigger: "blur"}],
                },//添加章节验证addVideoRuleFormRef
                addVideoRules: {
                    title: [
                        {required: true, message: "请输入小节名称", trigger: "blur"},
                        {min: 2, max: 25, message: "长度在 2 到 25 个字符", trigger: "blur"}
                    ],
                    sort: [{required: true, message: "请输入课程小节排序", trigger: "blur"}],
                },//添加课程小节验证
                imgFilesList: [],
                categorykeys: [] //搜索类别
                , //级联选择器配置项
                columns: [
                    {
                        label: "章节名称",
                        width: "200px",
                        headerAlign: "left",
                        align: "left",
                        prop: "title"
                    },
                    {
                        label: "排序",
                        headerAlign: "center",
                        align: "center",
                        prop: "sort"
                    },
                    {
                        label: "播放次数",
                        headerAlign: "center",
                        align: "center",
                        prop: "playCount"
                    },
                    {
                        label: "创建时间",
                        headerAlign: "center",
                        width: "150px",
                        align: "center",
                        prop: "gmtCreate"
                    },
                    {
                        label: "修改时间",
                        headerAlign: "center",
                        align: "center",
                        width: "150px",
                        prop: "gmtModified"
                    },
                    {
                        label: "时长",
                        headerAlign: "center",
                        align: "center",
                        prop: "duration",
                        type: "template",
                        template: "duration"
                    },
                    {
                        label: "阿里云视频源",
                        headerAlign: "center",
                        align: "center",
                        type: "template",
                        prop: "videoSourceId",
                        template: "videoSourceId"
                    },
                    {
                        label: "所属章节",
                        headerAlign: "center",
                        prop: "lev",
                        type: "template",
                        align: "center",
                        template: "lev"
                    },
                    {
                        label: "是否免费",
                        headerAlign: "center",
                        prop: "isFree",
                        type: "template",
                        align: "center",
                        template: "isFree"
                    },
                    {
                        label: "操作",
                        headerAlign: "center",
                        type: "template",
                        width: "200px",
                        template: "caozuo"
                    }
                ]

            };
        },
        filters:{
            formatDate(time){
                let data = new Date(time);
                return formatDate(data,'hh:mm:ss');
            }
        },
        methods: {
            // 停止播放视频
            handleViewVideoClose(done) {
                this.player.pause()
                done()
            },
            //加载课程章节数据
            async getEduChapterList() {
                const { data: res } = await this.$http.get(
                    "eduservice/chapter/chapterTree",
                    {
                        params: this.queryMap
                    }
                );
                if (res.code !== 200) return this.$message.error("分类列表失败");
                if(res.data.rows!=null){
                    this.chapters = res.data.rows;
                }else{
                    this.chapters =[]
                }
                console.log(this.chapters)
                this.total = res.data.total;
            },
            // 关闭上传视频弹框
            handleUploadVideoClose(done) {
                this.$confirm('确认关闭？')
                    .then(_ => {
                        done()
                        this.$refs.videoUpload.clearFiles();
                        this.getEduChapterList()
                    })
                    .catch(_ => {})
            },
            //重置查询表单
            resetForm() {
                this.queryMap = {
                    pageNum: 1,
                    pageSize: 5,
                    name: "",
                    categoryId: "",
                    supplier: "",
                    status: 0,
                };
            },
            /**
             * 打开添加课程弹框
             */
            openAdd() {
                this.getCatetorys();
                this.addDialogVisible = true;
            },
            /**
             * 打开添加章弹框
             */
          async  openEditChapter(id) {
                this.titleChapter="编辑章"
                this.chapter.id=id
                const {data: res} = await this.$http.get("eduservice/chapter/edit/" + id)
                if (res.code == 200) {
                    this.chapter = res.data
                } else {
                    return this.$message.error("课程大章编辑失败" + res.msg)
                }
                this.addChapterDialogVisible = true;
            },
            /**
             * 打开添加课程小节弹框
             */
            openAddVideo(id) {
                this.video.id=null
                this.titleVideo="添加课时"
                this.chapter.id=id
                this.addVideoDialogVisible = true
            },
            /**
             * 打开编辑课程小节弹框
             */
           async openEditVideo(id) {
                this.video.id=id
                this.titleVideo="编辑课时"
                const {data: res} = await this.$http.get("eduservice/video/edit/" + id)
                if(res.code == 200){
                    this.video = res.data
                }
                this.addVideoDialogVisible = true
            },


            /**
             * 打开上传视频弹框
             */
            uploadVideoById(videoId) {
                this.uploadPercent=0 //上传视频进度比
                this.showProgress=false // 是否显示进度条
                this.i = 0
                this.video.id = videoId
                // 弹出框
                this.dialogUploadVideoVisible = true
            },
           async resetPercent(){
               const {data: res} = await this.$http.get("vidservice/vod/percent/reset?videoId=" + this.video.id);
               this.uploadPercent=0
               clearInterval(this.intervalId)
            },
            //文件上传时
            fileOnProgress(event, file, fileList){
                console.log("文件上传时----------------")

                console.log(file)
                console.log(fileList)
            },
            // 文件上传成功
            FileOnSuccess(response, file, fileList){
                // 进度条隐藏
                this.showProgress = false
                // 重置uploadPercent上传进度条
                this.resetPercent()
                // 重新加载课程大纲
                this.getEduChapterList()
                this.$notify({
                    title: '成功',
                    message: response.msg,
                    type: 'success'
                });

            },
            /**
             * 上传视频进度条
             */
            handleProgress(file) {
                // 文件标志
                 let fileDetails = file.name+file.size+file.type+file.lastModifiedDate;
                //使用当前文件的信息用md5加密生成一个key 这个加密是根据文件的信息来加密的  如果相同的文件 加的密还是一样的
                let key = md5(fileDetails);
                this.video.fileKey = key
                if (this.i === 0) { // 控制上传中状态只执行一次上传
                    this.showStatus()
                    this.showProgress = true
                    this.i = 1
                }
            },

            /**
             * 获取进度条
             */
            getUploadPercent(){
                this.$http.get("vidservice/vod/getUploadPercent?videoId="+this.video.id)
                    .then(response => {
                        console.log(response.data.data)
                        let percent = response.data.data
                        if (percent >= 100) {
                            clearInterval(this.intervalId)
                            percent = 100// 不能大于100
                        }
                        this.uploadPercent = percent
                    })
                    .catch(response => {
                        this.$message({
                            type: 'error',
                            message: '获取进度条失败！'
                        })
                    })
            },

            /**
             * 定时查询上传进度 1秒查一次
             */
             showStatus() {
                 this.intervalId =  setInterval(this.getUploadPercent, 1000)
            },
            // 记忆视频播放时间
            saveTime(memoryPlay) {
                console.log(memoryPlay.getCurrentTime())
            },
            // 关闭广告
            videoAdClose(videoAd){
                videoAd.pauseVideoAd()
                var result = confirm('确定开通会员关闭广告吗？')
                if (result) {
                    /* Register the skip event to skip the ad. */
                    videoAd.closeVideoAd()
                } else {
                    /* Register the play event to play the ad. */
                    videoAd.playVideoAd()
                }
            },
            creatAliplayer() {
                this.player = new Aliplayer({
                    id: 'J_prismPlayer',
                    width: '100%',
                    autoplay: true,
                    // 播放方式二：点播用户推荐
                    vid: this.video.videoSourceId,
                    playauth: this.video.playAuth,
                    cover: 'http://java.goodym.cn/moyuplaylogo.png',
                    encryptType: 1, // 当播放私有加密流时需要设置。
                    components: [
                      /*  {// 非会员预览组件
                        name: 'PreviewVodComponent',
                        type: AliPlayerComponent.PreviewVodComponent,
                        args: [10, '#endPreviewTemplate', `<a href="https://www.aliyun.com/product/vod" class="vip-join" target="_blank" style="color: wheat;">开通会员</a> 观看完整视频`]
                    },*/
                    {// 视频清晰度组件
                        name: 'QualityComponent',
                        type: AliPlayerComponent.QualityComponent
                    },
                        // 视频暂停弹出图片广告
                  /* {
                        name: 'PauseADComponent',
                        type: AliPlayerComponent.PauseADComponent,
                        args: ['http://java.goodym.cn/moyuad.png', 'http://java.goodym.cn/']
                    },*/
                  // 视频开始前先播放视频广告
                       /* {
                            name: 'VideoADComponent',
                            type: AliPlayerComponent.VideoADComponent,
                            args: ['http://java.goodym.cn/adv.mp4', 'http://java.goodym.cn/', this.videoAdClose, 'VIP关闭广告']
                        },*/
                    {// 倍速组件
                        name: 'RateComponent',
                        type: AliPlayerComponent.RateComponent
                    }]
                }, function(player) {
                    console.log('播放器创建好了。')
                })
            },

            // 点击预览章节视频
            async  playVideoByVideoId(videoId) {
                console.log(videoId)
                this.video.videoSourceId = videoId
                // 弹出框
                this.dialogVideoVisible = true
                const {data: res} = await this.$http.get("/vidservice/vod/getPlayAuth/" + videoId);
                if (res.code == 200) {
                    this.video.playAuth = res.msg
                    if (this.player === '') {
                        this.creatAliplayer()
                    } else {
                        console.log("难道能进入到这里？")
                        this.player.replayByVidAndPlayAuth(this.video.videoSourceId, this.video.playAuth)
                    }
                    // 设置预览时间
                   /* this.player.isPreview(true)
                    this.player.setPreviewTime(10)
                    this.player.getComponent('PreviewVodComponent').closePreviewLayer()*/
                }

            },

            /**
             * 搜索课程
             */
            search() {
                this.queryMap.pageNum = 1;
                this.getCourseList();
            },

            /**
             * 课程添加审核
             */
            async publish(id) {
                const {data: res} = await this.$http.put("course/publish/" + id);
                if (res.code !== 200) {
                    return this.$message.error("审核失败:" + res.msg);
                } else {
                    this.getCourseList();
                    return this.$message.success("课程已审核通过");
                }
            },
            /**
             * 删除课程
             */
            async delCourse(id) {
                let res = await this.$confirm(
                    "此操作将永久删除该课程, 是否继续?",
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
                if (res === "confirm") {
                    const {data: res} = await this.$http.delete("eduservice/course/delete/" + id);
                    if (res.code === 200) {
                        this.$message.success("课程删除成功");
                        this.getCourseList();
                    } else if(res.code ===20001) {
                        this.$message.error("删除课程失败，请先删除课程大纲");
                    }
                }
            },
            /**
             * 更新课程
             */
            async updateCourse() {
                this.$refs.editRuleFormRef.validate(async valid => {
                    if (!valid) {
                        return;
                    } else {
                        this.btnDisabled = true;
                        this.btnLoading = true;
                        const {data: res} = await this.$http.put(
                            "eduservice/course/update/" + this.editRuleForm.id,
                            this.editRuleForm
                        );
                        if (res.code == 200) {
                            this.$notify({
                                title: "成功",
                                message: "课程信息更新",
                                type: "success"
                            });
                            this.editRuleForm = {};
                            this.getCourseList();
                        } else {
                            this.$message.error("课程信息更新失败:" + res.msg);
                        }
                        this.editDialogVisible = false;
                        this.btnDisabled = false;
                        this.btnLoading = false;
                    }
                });
            },
            /**
             * 编辑课程
             */
            async editCourse(id) {
                const {data: res} = await this.$http.get("eduservice/course/edit/" + id);
                if (res.code == 200) {
                    this.editRuleForm = res.data;
                    let item = res.data;
                    this.imgFilesList.push({
                        url: item.cover,
                        name: item.title,
                        id: item.id
                    });
                } else {
                    return this.$message.error("课程信息编辑失败" + res.msg);
                }
                let array = [];
                array.push(res.data.subjectParentId);
                array.push(res.data.subjectId);
                this.editRuleForm.categoryKeys = array;
                this.editDialogVisible = true;
            },
            /**
             * 添加课程小节
             */
            async addVideo() {
                this.$refs.addVideoRuleFormRef.validate(async valid => {
                    if (!valid) {
                        return;
                    } else {
                        this.video.chapterId= this.chapter.id
                        this.btnDisabled = true;
                        this.btnLoading = true;

                        if(this.video.id!=null){
                            const {data: res} = await this.$http.put(
                                "eduservice/video/update/"+this.video.id,
                                this.video
                            );
                            if (res.code == 200) {
                                this.$message.success("课时编辑成功");
                                this.video = {};
                                this.getEduChapterList();
                            } else {
                                return this.$message.error("课时编辑失败:" + res.msg);
                            }
                        }else {
                            const {data: res} = await this.$http.post(
                                "eduservice/video/add",
                                this.video
                            );
                            if (res.code == 200) {
                                this.$message.success("课程小节添加成功");
                                this.video = {};
                                this.getEduChapterList();
                            } else {
                                return this.$message.error("课程小节添加失败:" + res.msg);
                            }
                        }

                        this.addVideoDialogVisible = false;
                        this.btnDisabled = false;
                        this.btnLoading = false;
                    }
                });
            },

            /**
             * 删除课时
             */
            async delVideo(id) {
                let res = await this.$confirm(
                    "此操作将永久删除该课时, 是否继续?",
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
                if (res === "confirm") {
                    const {data: res} = await this.$http.delete("eduservice/video/delete/" + id);
                    if (res.code === 200) {
                        this.$message.success("课时删除成功");
                        this.getEduChapterList();
                    } else if(res.code ===20001) {
                        this.$message.error("删除课时失败！");
                    }
                }
            },

            /**
             * 创建课程大纲
             */
            async editSyllabus(id) {
                const {data: res} = await this.$http.get("eduservice/course/edit/" + id);
                if (res.code == 200) {
                    this.syllabusDialogVisible = true
                    this.courseId = res.data.id
                    this.queryMap.courseId = res.data.id
                    this.getEduChapterList();
                } else {
                    return this.$message.error("课程大纲创建失败" + res.msg);
                }
            },
            /**
             * 保存课程
             */
            next() {
                // 判断添加还是修改，判断课程对象里面是否有id
                if (!this.editRuleForm.id) {
                    // 添加
                    this.add()
                } else {
                    // 修改
                    this.update()
                }
            },
            /**
             * 添加课程
             */
            add() {

                this.$refs.addRuleFormRef.validate(async valid => {
                    if (!valid) {
                        return;
                    } else {
                        this.btnDisabled = true;
                        this.btnLoading = true;
                        const {data: res} = await this.$http.post(
                            "eduservice/course/add",
                            this.addRuleForm
                        );
                        if (res.code == 200) {
                            this.$message.success("课程添加成功");
                            this.addRuleForm = {};
                            this.getCourseList();
                            this.syllabusDialogVisible=true
                        } else {
                            return this.$message.error("课程添加失败:" + res.msg);
                        }
                        this.addDialogVisible = false;
                        this.btnDisabled = false;
                        this.btnLoading = false;
                    }
                });
            },
            /**
             * 打开添加章弹框
             */
            openAddChapter() {
                this.chapter.id=null
                this.titleChapter="添加章"
                this.addChapterDialogVisible = true;
            },
            /**
             * 添加课程大章
             */
            addChapter() {

                this.$refs.addChapterRuleFormRef.validate(async valid => {
                    if (!valid) {
                        return;
                    } else {

                        if(this.courseId===null){
                            return;
                        }else{
                            this.chapter.courseId = this.courseId
                        }

                        this.btnDisabled = true;
                        this.btnLoading = true;
                        if(this.chapter.id!=null){ // 更新课程大章
                            const {data: res} = await this.$http.put(
                                "eduservice/chapter/update/"+this.chapter.id,
                                this.chapter
                            );
                            if (res.code == 200) {
                                this.$message.success("课程大章编辑成功");
                                this.chapter = {};
                            } else {
                                return this.$message.error("课程大章编辑失败:" + res.msg);
                            }

                        }else {
                            const {data: res} = await this.$http.post(
                                "eduservice/chapter/add",
                                this.chapter
                            );
                            if (res.code == 200) {
                                this.$message.success("课程大章添加成功");
                                this.chapter = {};
                            } else {
                                return this.$message.error("课程大章添加失败:" + res.msg);
                            }
                        }
                        this.getEduChapterList()
                        this.addChapterDialogVisible = false;
                        this.btnDisabled = false;
                        this.btnLoading = false;
                    }
                });
            },
            /**
             * 删除课程大章
             */
            async delChapter(id) {
                let res = await this.$confirm(
                    "此操作将永久删除该章节, 是否继续?",
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
                if (res === "confirm") {
                    const {data: res} = await this.$http.delete("eduservice/chapter/delete/" + id);
                    if (res.code === 200) {
                        this.$message.success("课程章节删除成功");
                        this.getEduChapterList();
                    } else if(res.code ===20001) {
                        this.$message.error("删除课程章节失败，该章节存在课时，请先删除课时，再来操作吧！");
                    }
                }
            },
            /**
             * 移除回收站
             */
            async remove(id) {
                const {data: res} = await this.$http.put("course/remove/" + id);
                if (res.code !== 200) {
                    return this.$message.error("移入回收站失败:" + res.msg);
                } else {
                    this.getCourseList();
                    return this.$message.success("移入回收站成功");
                }
            },
            /**
             * 从回收站恢复
             */
            async back(id) {
                const {data: res} = await this.$http.put("course/back/" + id);
                if (res.code !== 200) {
                    return this.$message.error("从回收站恢复失败:" + res.msg);
                } else {
                    this.getCourseList();
                    return this.$message.success("从回收站中已恢复");
                }
            },
            /**
             * 加载课程列表
             */
            async getCourseList() {
                const {data: res} = await this.$http.get("eduservice/course/findCourseList", {
                    params: this.queryMap
                });
                if (res.code !== 200) {
                    return this.$message.error("获取课程列表失败");
                } else {
                    this.total = res.data.total;
                    this.courseData = res.data.rows;
                }
            },
            /**
             * 加载课程类别
             */
            async getCatetorys() {
                const {data: res} = await this.$http.get(
                    "eduservice/subject/categoryTree"
                );
                if (res.code !== 200) {
                    return this.$message.error("获取课程类别失败");
                } else {
                    this.catetorys = res.data.rows;
                }
            },
            handleChange(file, fileList) {
                this.uploadDisabled = fileList.length >= this.limitcount;
            },
            handleRemove(file, fileList) {
                this.uploadDisabled = fileList.length >= this.limitcount;
                this.addRuleForm.cover = "";
            },
            //改变页码
            handleSizeChange(newSize) {
                this.queryMap.pageSize = newSize;
                this.getCourseList();
            },
            //课程翻页
            handleCurrentChange(current) {
                this.queryMap.pageNum = current;
                this.getCourseList();
            },
            //课程大纲改变页码
            handleChapterSizeChange(newSize) {
                this.queryMap.pageSize = newSize;
                this.getEduChapterList();
            },
            //课程大纲翻页
            handleChapterCurrentChange(current) {
                this.queryMap.pageNum = current;
                this.getEduChapterList();
            },
            //关闭弹出框
            closeAddDialog() {
                this.$refs.addRuleFormRef.clearValidate();
                this.addRuleForm = {};
                this.$refs.upload.clearFiles();
            },
            //关闭创建课程大纲弹出框
            closeAddSyllabusDialog() {
                this.chapters = []
            },
            //关闭新增课程大章弹出框
            closeAddChapterDialog() {
                this.$refs.addChapterRuleFormRef.clearValidate();
                this.chapter = {};
            },
            //关闭新增课程小节弹出框
            closeAddVideoDialog() {
                this.$refs.addVideoRuleFormRef.clearValidate();
                this.video = {sort:1,isFree:0};
            },
            //关闭弹出框
            closeEditDialog() {
                this.$refs.editRuleFormRef.clearValidate();
                this.editRuleForm = {};
                this.$refs.upload2.clearFiles();
                this.imgFilesList = [];
            },
            handleSuccess(response, file, fileList) {
                this.addRuleForm.cover = response.msg;
            },
            handlePictureCardPreview(file) {
                this.dialogImageUrl = file.url;
                this.dialogVisible = true;
            },
            //编辑
            editHandleSuccess(response, file, fileList) {
                this.editRuleForm.cover = response.msg;
            },
            /**
             * 加载课程类别
             */
            async getCatetorys() {
                const {data: res} = await this.$http.get(
                    "eduservice/subject/categoryTree"
                );
                if (res.code !== 200) {
                    return this.$message.error("获取课程类别失败");
                } else {
                    this.catetorys = res.data.rows;
                }
            },
            /**
             * 分类搜索改变时
             */
            selectChange() {
                var str = "";
                for (var i = 0; i < this.categorykeys.length; i++) {
                    str += this.categorykeys[i] + ",";
                }
                str = str.substring(0, str.length - 1);
                this.queryMap.categorys = str;
            }
        },
        created() {
            this.getCourseList();
            this.getCatetorys();
            setTimeout(() => {
                this.loading = false;
            }, 500);
        }
    };
</script>

<style scoped>
    .vip-join {
        color: #00c1de;
    }

    .vip_limit_content {
        display: flex;
        width: 100%;
        height: 100%;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
    }

    .vip_limit_content .title {
        font-size: 18px;
        line-height: 36px;
        color: #fff;
        text-align: center;
        width: 100%;
    }

    .vip_limit_button_box {
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        width: 100%;
    }

    .vip_limit_btn {
        display: inline-block;
        min-width: 100px;
        position: relative;
        background: #f60;
        padding: 0 35px;
        margin: 0px 5px 20px 5px;
        border-radius: 38px;
        font-size: 18px;
        line-height: 38px;
        color: #623A0C;
        text-align: center;
        background-image: linear-gradient(-135deg, #FBE8A8 0%, #F8E7AC 15%, #E2C078 100%);
        cursor: pointer;
    }

    .vip_limit_close {
        text-align: center;
    }
    .vip_limit_close span {
        display: inline-block;
        width: 40px;
        height: 40px;
        line-height: 36px;
        background: rgba(165, 165, 165, 0.54);
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
    }
</style>

