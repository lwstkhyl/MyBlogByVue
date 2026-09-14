<template>
  <div class="user-manager">
    <el-card class="account-card">
      <div slot="header">
        <span>修改我的密码</span>
      </div>
      <el-form
        :model="passwordForm"
        label-width="100px"
        @submit.native.prevent="changeOwnPassword"
      >
        <el-form-item label="当前密码">
          <el-input
            v-model="passwordForm.currentPassword"
            type="password"
            autocomplete="current-password"
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item label="新密码">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            autocomplete="new-password"
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            autocomplete="new-password"
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            :loading="changingPassword"
          >修改密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="userRole === 'admin'" class="account-card">
      <div slot="header" class="card-header">
        <span>用户管理</span>
        <el-button type="primary" size="small" @click="openCreateUser">注册用户</el-button>
      </div>
      <el-table v-loading="loadingUsers" :data="users" style="width: 100%">
        <el-table-column prop="username" label="用户名"></el-table-column>
        <el-table-column prop="role" label="角色" width="120">
          <template v-slot="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'info'">{{ row.role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template v-slot="{ row }">
            <el-button type="text" @click="openEditUser(row)">修改</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      :title="userDialogMode === 'create' ? '注册用户' : '修改用户'"
      :visible.sync="userDialogVisible"
      width="450px"
      :append-to-body="true"
      :close-on-click-modal="!(savingUser || deletingUser)"
      :close-on-press-escape="!(savingUser || deletingUser)"
      :show-close="!(savingUser || deletingUser)"
      @closed="resetUserForm"
    >
      <el-form :model="userForm" label-width="90px" @submit.native.prevent="saveUser">
        <el-form-item label="用户名">
          <el-input v-model="userForm.username" maxlength="32" show-word-limit></el-input>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="userForm.role" style="width: 100%">
            <el-option label="管理员" value="admin"></el-option>
            <el-option label="普通用户" value="user"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="userDialogMode === 'create' ? '密码' : '新密码'">
          <el-input
            v-model="userForm.password"
            type="password"
            autocomplete="new-password"
            :placeholder="userDialogMode === 'edit' ? '留空则不修改密码' : ''"
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input
            v-model="userForm.confirmPassword"
            type="password"
            autocomplete="new-password"
            :placeholder="userDialogMode === 'edit' ? '留空则不修改密码' : ''"
            show-password
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="user-dialog-footer">
        <el-tooltip
          v-if="userDialogMode === 'edit'"
          :disabled="!isProtectedUser"
          content="admin 和 public_admin 不允许删除"
          placement="top"
        >
          <span>
            <el-button
              type="danger"
              :disabled="isProtectedUser || savingUser"
              :loading="deletingUser"
              @click="deleteUser"
            >删除用户</el-button>
          </span>
        </el-tooltip>
        <span class="user-dialog-actions">
          <el-button
            :disabled="savingUser || deletingUser"
            @click="userDialogVisible = false"
          >取消</el-button>
          <el-button
            type="primary"
            :disabled="deletingUser"
            :loading="savingUser"
            @click="saveUser"
          >确认</el-button>
        </span>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import request from '../api/request';
import { encryptPassword } from '../utils/crypto';

export default {
  name: 'UserManager',
  data(){
    return {
      users: [],
      loadingUsers: false,
      changingPassword: false,
      savingUser: false,
      deletingUser: false,
      userDialogVisible: false,
      userDialogMode: 'create',
      passwordForm: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      },
      userForm: {
        id: '',
        originalUsername: '',
        username: '',
        role: 'user',
        password: '',
        confirmPassword: '',
      },
    };
  },
  computed: {
    ...mapState('auth', { isLoggedIn: 'token', userRole: 'userRole' }),
    isProtectedUser(){
      const username = (this.userForm.originalUsername || '').trim().toLowerCase();
      return ['admin', 'public_admin'].includes(username);
    },
  },
  activated(){
    this.initialize();
  },
  methods: {
    ...mapActions('auth', ['isLogin']),
    async initialize(){
      await this.isLogin();
      if(!this.isLoggedIn) {
        this.$message.warning('请先登录');
        this.$router.push('/');
        return;
      }
      if(this.userRole === 'admin') await this.loadUsers();
      else this.users = [];
    },
    getErrorMessage(err, fallback){
      const data = err.response && err.response.data;
      if(typeof data === 'string') return data || fallback;
      return (data && (data.error || data.message)) || fallback;
    },
    validatePassword(password, confirmPassword, passwordRequired = true){
      if(passwordRequired && !password) return '密码不能为空';
      if(password && password.length < 6) return '密码不能少于6个字符';
      if(password !== confirmPassword) return '两次输入的密码不一致';
      return '';
    },
    async changeOwnPassword(){
      if(!this.passwordForm.currentPassword) return this.$message.error('请输入当前密码');
      const validationError = this.validatePassword(
        this.passwordForm.newPassword,
        this.passwordForm.confirmPassword
      );
      if(validationError) return this.$message.error(validationError);

      this.changingPassword = true;
      try {
        await request.patch('/users/password', {
          currentPassword: encryptPassword(this.passwordForm.currentPassword),
          newPassword: encryptPassword(this.passwordForm.newPassword),
        });
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.$message.success('密码修改成功');
      } catch(err) {
        this.$message.error(this.getErrorMessage(err, '密码修改失败'));
      } finally {
        this.changingPassword = false;
      }
    },
    async loadUsers(){
      this.loadingUsers = true;
      try {
        const res = await request.get('/users');
        this.users = res.data;
      } catch(err) {
        this.$message.error(this.getErrorMessage(err, '获取用户列表失败'));
      } finally {
        this.loadingUsers = false;
      }
    },
    openCreateUser(){
      this.userDialogMode = 'create';
      this.resetUserForm();
      this.userDialogVisible = true;
    },
    openEditUser(user){
      this.userDialogMode = 'edit';
      this.userForm = {
        id: user._id,
        originalUsername: user.username,
        username: user.username,
        role: user.role,
        password: '',
        confirmPassword: '',
      };
      this.userDialogVisible = true;
    },
    resetUserForm(){
      this.userForm = {
        id: '',
        originalUsername: '',
        username: '',
        role: 'user',
        password: '',
        confirmPassword: '',
      };
    },
    async saveUser(){
      const username = this.userForm.username.trim();
      if(!username) return this.$message.error('用户名不能为空');
      if(!['admin', 'user'].includes(this.userForm.role)) return this.$message.error('请选择用户角色');

      const passwordRequired = this.userDialogMode === 'create';
      const validationError = this.validatePassword(
        this.userForm.password,
        this.userForm.confirmPassword,
        passwordRequired
      );
      if(validationError) return this.$message.error(validationError);

      const data = { username, role: this.userForm.role };
      if(this.userForm.password) data.password = encryptPassword(this.userForm.password);

      this.savingUser = true;
      try {
        if(this.userDialogMode === 'create') await request.post('/users', data);
        else await request.patch(`/users/${this.userForm.id}`, data);
        this.userDialogVisible = false;
        this.$message.success(this.userDialogMode === 'create' ? '用户注册成功' : '用户修改成功');
        await this.isLogin();
        if(this.userRole === 'admin') await this.loadUsers();
      } catch(err) {
        this.$message.error(this.getErrorMessage(err, '保存用户失败'));
      } finally {
        this.savingUser = false;
      }
    },
    async deleteUser(){
      if(this.userDialogMode !== 'edit' || !this.userForm.id) return;
      if(this.isProtectedUser) {
        return this.$message.error('admin 和 public_admin 不允许删除');
      }

      try {
        await this.$confirm(
          `确定删除用户“${this.userForm.originalUsername}”吗？此操作不可恢复。`,
          '删除用户',
          {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'warning',
          }
        );
      } catch(err) {
        return;
      }

      this.deletingUser = true;
      try {
        await request.delete(`/users/${this.userForm.id}`);
        this.userDialogVisible = false;
        this.$message.success('用户删除成功');
        await this.isLogin();
        if(!this.isLoggedIn) {
          this.$router.push('/');
          return;
        }
        if(this.userRole === 'admin') await this.loadUsers();
      } catch(err) {
        this.$message.error(this.getErrorMessage(err, '删除用户失败'));
      } finally {
        this.deletingUser = false;
      }
    },
  },
};
</script>

<style scoped>
.user-manager{
  max-width: 900px;
  margin: 0 auto;
}
.account-card{
  margin-bottom: 20px;
}
.card-header{
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.account-card .el-form{
  max-width: 520px;
}
.user-dialog-footer{
  display: flex;
  align-items: center;
}
.user-dialog-actions{
  margin-left: auto;
}
@media screen and (max-width: 600px){
  .account-card ::v-deep .el-card__body{
    padding: 15px 10px;
  }
  .account-card .el-form{
    max-width: none;
  }
}
</style>
