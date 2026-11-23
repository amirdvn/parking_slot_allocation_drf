from django.contrib.auth.base_user import BaseUserManager
from accounts.translations.fa import MESSAGES

class UserManager(BaseUserManager):

    def create_user(self, phone_number, email, full_name, role, department):
        if not phone_number:
            raise ValueError(MESSAGES['user']['phone_required'])
        if not email:
            raise ValueError(MESSAGES['user']['email_required'])
        if not full_name:
            raise ValueError(MESSAGES['user']['full_name_required'])
        if not role:
            raise ValueError(MESSAGES['user']['role_required'])
        if not department:
            raise ValueError(MESSAGES['user']['department_required'])

        user = self.model(
            phone_number=phone_number,
            email=self.normalize_email(email),
            full_name=full_name,
            role=role,
            department=department
        )
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, email, full_name, password):
        user = self.create_user(
            phone_number, email, full_name,
            role=self.model.Role.MANAGER,
            department=self.model.Department.MANAGEMENT,
        )
        user.set_password(password)
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.can_manage_users = True
        user.save(using=self._db)
        return user