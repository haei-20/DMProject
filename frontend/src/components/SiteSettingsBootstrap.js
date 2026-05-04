import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useGetPublicGeneralSettingsQuery } from '../services/api';
import { setSiteCurrencyFromApi } from '../redux/slices/siteSettingsSlice';

/**
 * Tải cấu hình tiền tệ công khai vào Redux để formatPrice dùng trên toàn site.
 */
const SiteSettingsBootstrap = () => {
  const dispatch = useDispatch();
  const { data, isSuccess } = useGetPublicGeneralSettingsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (isSuccess && data) {
      dispatch(setSiteCurrencyFromApi(data));
    }
  }, [isSuccess, data, dispatch]);

  return null;
};

export default SiteSettingsBootstrap;
